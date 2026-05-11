"""
AI Service — LangChain + OpenRouter
Fixes loop-detection error by:
  1. Using google/gemma-3-27b-it:free as default (handles JSON better)
  2. Prompts describe the schema in prose instead of embedding raw JSON templates
     (the {{ }} repetition in templates was what triggered OpenRouter's loop detector)
  3. Auto-fallback to qwen/qwen-2.5-72b-instruct:free on loop errors
"""
import json
import logging
from typing import Any, Dict, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Reliable free models on OpenRouter ───────────────────────────────────────
# Ranked by structured-output reliability:
FALLBACK_MODEL = "qwen/qwen-2.5-72b-instruct:free"


# ─── LLM Client ───────────────────────────────────────────────────────────────
def get_llm(model: Optional[str] = None, temperature: float = 0.3) -> ChatOpenAI:
    """
    OpenRouter-backed ChatOpenAI client.
    Set OPENROUTER_MODEL in .env to override the model.
    Default: google/gemma-3-27b-it:free
    """
    return ChatOpenAI(
        model=model or settings.OPENROUTER_MODEL,
        temperature=temperature,
        api_key=settings.active_api_key,
        base_url=settings.OPENROUTER_BASE_URL,
        max_tokens=settings.OPENAI_MAX_TOKENS,
        default_headers={
            "HTTP-Referer": "https://traderai.in",
            "X-Title": "TraderAI",
        },
    )


async def _invoke_with_retry(
    messages: list,
    temperature: float = 0.3,
) -> str:
    """
    Call the LLM and automatically retry with a fallback model if OpenRouter
    raises a loop-detection error (e.g. 'model output error: looping content').
    """
    for attempt, model in enumerate([settings.OPENROUTER_MODEL, FALLBACK_MODEL]):
        try:
            llm = get_llm(model=model, temperature=temperature)
            response = await llm.ainvoke(messages)
            return response.content
        except Exception as e:
            err = str(e).lower()
            is_loop_error = any(
                kw in err
                for kw in ("looping", "loop detection", "model output error", "flagged")
            )
            if is_loop_error and attempt == 0:
                logger.warning(
                    "Loop-detection error on model %s — retrying with %s",
                    model,
                    FALLBACK_MODEL,
                )
                continue
            raise  # non-loop error or already on fallback → propagate

    raise RuntimeError("All models failed with loop-detection errors")


def _extract_json(content: str) -> str:
    """Strip markdown fences from model output to get raw JSON."""
    content = content.strip()
    if "```json" in content:
        content = content.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in content:
        content = content.split("```", 1)[1].split("```", 1)[0]
    # Some models wrap JSON in extra text — find the first { or [
    start = content.find("{")
    if start > 0:
        content = content[start:]
    return content.strip()


# ─── Portfolio Generation ─────────────────────────────────────────────────────

PORTFOLIO_SYSTEM = (
    "You are a senior Indian equity portfolio manager with 20+ years on NSE/BSE. "
    "You always produce valid JSON. You never repeat yourself. "
    "All output is for EDUCATIONAL purposes only — not investment advice. "
    "STRICT: respond with a single JSON object and nothing else — no markdown, "
    "no preamble, no explanation."
)


def _portfolio_prompt(
    investment_amount: float,
    sip_amount: float,
    risk_tolerance: str,
    investment_horizon: str,
    preferred_sectors: str,
    age: str,
    goals: str,
) -> str:
    """
    Prose-based prompt — avoids raw JSON template blocks that trigger loop detection.
    The schema is described in words, not shown as a repeated template.
    """
    return (
        f"Create a diversified Indian stock portfolio with these inputs:\n"
        f"Investment: Rs {investment_amount:,.0f} | SIP: Rs {sip_amount:,.0f}/month | "
        f"Risk: {risk_tolerance} | Horizon: {investment_horizon} | "
        f"Sectors: {preferred_sectors} | Age: {age} | Goals: {goals}\n\n"
        f"Respond with a single JSON object containing:\n"
        f"- 'holdings': array of 6 to 10 stocks. Each stock needs: "
        f"symbol (NSE format ending .NS), name, sector, allocation_pct, "
        f"amount_inr, reasoning (2 sentences), risk_level, expected_cagr, time_horizon.\n"
        f"- 'portfolio_summary': 2-paragraph strategy explanation.\n"
        f"- 'expected_cagr': blended annual return estimate as a number.\n"
        f"- 'risk_profile': one-word risk descriptor.\n"
        f"- 'key_risks': list of 3 risk strings.\n"
        f"- 'disclaimer': SEBI educational disclaimer string.\n\n"
        f"Rules: allocation_pct values must sum to exactly 100. "
        f"NSE symbols only. Output JSON only."
    )


async def generate_portfolio(
    investment_amount: float,
    sip_amount: float,
    risk_tolerance: str,
    investment_horizon: str,
    preferred_sectors: List[str],
    age: Optional[int],
    goals: Optional[str],
) -> Dict[str, Any]:
    """Generate AI portfolio recommendation via OpenRouter."""
    if not settings.active_api_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not set. Get a free key at https://openrouter.ai/keys"
        )

    sectors_str = ", ".join(preferred_sectors) if preferred_sectors else "all sectors"
    prompt = _portfolio_prompt(
        investment_amount=investment_amount,
        sip_amount=sip_amount or 0,
        risk_tolerance=risk_tolerance,
        investment_horizon=investment_horizon.replace("_", " "),
        preferred_sectors=sectors_str,
        age=str(age) if age else "not specified",
        goals=goals or "wealth creation",
    )

    messages = [
        SystemMessage(content=PORTFOLIO_SYSTEM),
        HumanMessage(content=prompt),
    ]

    try:
        raw = await _invoke_with_retry(messages, temperature=0.3)
        data = json.loads(_extract_json(raw))

        # Normalize allocations to exactly 100
        holdings = data.get("holdings", [])
        if holdings:
            total = sum(h.get("allocation_pct", 0) for h in holdings)
            if total > 0 and abs(total - 100) > 0.5:
                for h in holdings:
                    h["allocation_pct"] = round((h["allocation_pct"] / total) * 100, 2)
                    h["amount_inr"] = round((h["allocation_pct"] / 100) * investment_amount, 0)

        logger.info("Portfolio generated: %d holdings", len(holdings))
        return data

    except json.JSONDecodeError as e:
        logger.error("JSON parse error in portfolio generation: %s", e)
        raise ValueError(f"AI returned invalid JSON — try again: {e}")
    except Exception as e:
        logger.error("Portfolio generation failed: %s", e)
        raise


# ─── Stock Analysis ───────────────────────────────────────────────────────────

STOCK_ANALYSIS_SYSTEM = (
    "You are a CFA-certified equity research analyst specialising in Indian markets. "
    "You write precise, balanced analysis. You always mention risks. "
    "You always reference Indian regulatory context (SEBI, RBI, GST). "
    "STRICT: output a single JSON object only — no markdown, no extra text."
)


def _stock_analysis_prompt(
    company_name: str,
    symbol: str,
    sector: str,
    price: Any,
    market_cap: str,
    pe_ratio: Any,
    roe: float,
    debt_to_equity: Any,
    revenue_growth: float,
    profit_margin: float,
    week_52_high: Any,
    week_52_low: Any,
    description: str,
) -> str:
    """Prose-based stock analysis prompt — avoids loop-triggering JSON templates."""
    return (
        f"Analyse {company_name} ({symbol}).\n"
        f"Data: sector={sector}, price=Rs {price}, market_cap={market_cap}, "
        f"PE={pe_ratio}, ROE={roe}%, D/E={debt_to_equity}, "
        f"revenue_growth={revenue_growth}%, profit_margin={profit_margin}%, "
        f"52w_high=Rs {week_52_high}, 52w_low=Rs {week_52_low}.\n"
        f"Business: {description}\n\n"
        f"Return a JSON object with these keys:\n"
        f"- investment_thesis: 3 paragraphs bull case.\n"
        f"- bear_case: 2 paragraphs of risks and downside.\n"
        f"- swot: object with four string arrays: strengths (5 items), "
        f"weaknesses (3), opportunities (3), threats (3).\n"
        f"- valuation_view: string — Overvalued / Fairly valued / Undervalued with reason.\n"
        f"- key_risks: array of 3 risk strings.\n"
        f"- suitable_for: array of investor type strings.\n"
        f"- ai_sentiment_score: integer 0-100.\n"
        f"- risk_rating: low / medium / high.\n"
        f"- disclaimer: educational disclaimer string.\n\n"
        f"Output JSON only."
    )


async def analyze_stock(
    symbol: str,
    company_name: str,
    profile_data: Dict[str, Any],
) -> Dict[str, Any]:
    """Generate AI stock analysis: SWOT, thesis, risk rating."""
    if not settings.active_api_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not set. Get a free key at https://openrouter.ai/keys"
        )

    fundamentals = profile_data.get("fundamentals", {})

    prompt = _stock_analysis_prompt(
        company_name=company_name,
        symbol=symbol,
        sector=profile_data.get("sector", "Unknown"),
        price=profile_data.get("price", "N/A"),
        market_cap=f"{(profile_data.get('market_cap', 0) or 0) / 1e9:.1f}B",
        pe_ratio=fundamentals.get("pe_ratio", "N/A"),
        roe=round((fundamentals.get("roe", 0) or 0) * 100, 1),
        debt_to_equity=fundamentals.get("debt_to_equity", "N/A"),
        revenue_growth=round((fundamentals.get("revenue_growth_yoy", 0) or 0) * 100, 1),
        profit_margin=round((fundamentals.get("profit_margin", 0) or 0) * 100, 1),
        week_52_high=profile_data.get("week_52_high", "N/A"),
        week_52_low=profile_data.get("week_52_low", "N/A"),
        description=(profile_data.get("description") or "")[:400],
    )

    messages = [
        SystemMessage(content=STOCK_ANALYSIS_SYSTEM),
        HumanMessage(content=prompt),
    ]

    try:
        raw = await _invoke_with_retry(messages, temperature=0.4)
        return json.loads(_extract_json(raw))
    except json.JSONDecodeError:
        logger.error("JSON parse error in stock analysis for %s", symbol)
        return {
            "error": "Analysis parsing failed",
            "investment_thesis": "Analysis temporarily unavailable — try again.",
        }
    except Exception as e:
        logger.error("Stock analysis failed for %s: %s", symbol, e)
        raise


# ─── AI Chat ──────────────────────────────────────────────────────────────────

CHAT_SYSTEM = (
    "You are TraderAI — a friendly AI assistant for Indian retail investors. "
    "You explain stock market concepts clearly and simply. "
    "Rules: never give definitive buy/sell calls; always add a SEBI disclaimer "
    "when discussing specific stocks; reference Indian market context (NSE, BSE, "
    "SEBI, RBI, FII, SIP, ELSS etc.); be conversational and beginner-friendly."
)


async def chat(
    message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """Conversational financial assistant with history support."""
    if not settings.active_api_key:
        return (
            "AI chat is not configured. Add OPENROUTER_API_KEY to your .env file. "
            "Get a free key at https://openrouter.ai/keys"
        )

    messages: list = [SystemMessage(content=CHAT_SYSTEM)]

    # Inject conversation history (last 10 turns)
    for msg in (conversation_history or [])[-10:]:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=message))

    try:
        return await _invoke_with_retry(messages, temperature=0.7)
    except Exception as e:
        logger.error("Chat failed: %s", e)
        return "I'm having trouble connecting right now. Please try again in a moment."
