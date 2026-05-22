from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import SimulatorSession, User, Progress
from app.schemas.simulator import (
    StartSessionRequest,
    AnswerRequest,
    AnswerResponse,
    SessionOut,
    ScenarioOut,
)
from app.simulator.scenarios import (
    SCENARIOS,
    get_scenario,
    list_scenarios,
    find_step,
    next_step_id,
)

router = APIRouter(prefix="/simulator", tags=["simulator"])


@router.get("/scenarios")
async def scenarios_list():
    return list_scenarios()


@router.get("/scenarios/{scenario_id}", response_model=ScenarioOut)
async def scenario_detail(scenario_id: str):
    s = get_scenario(scenario_id)
    if not s:
        raise HTTPException(404, "Scenario not found")
    return s


@router.post("/sessions", response_model=SessionOut)
async def start_session(payload: StartSessionRequest, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")
    scenario = get_scenario(payload.scenario_id)
    if not scenario:
        raise HTTPException(404, "Scenario not found")

    session = SimulatorSession(
        user_id=user.id,
        scenario_id=scenario["id"],
        state={"current_step_id": scenario["steps"][0]["id"], "log": []},
        score=0,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/answer", response_model=AnswerResponse)
async def answer(payload: AnswerRequest, db: AsyncSession = Depends(get_session)):
    session = await db.get(SimulatorSession, payload.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    if session.finished:
        raise HTTPException(400, "Session is already finished")

    scenario = get_scenario(session.scenario_id)
    step = find_step(scenario, payload.step_id)
    if not step:
        raise HTTPException(404, "Step not found")
    option = next((o for o in step["options"] if o["id"] == payload.option_id), None)
    if not option:
        raise HTTPException(404, "Option not found")

    points_awarded = int(option["points"])
    session.score += points_awarded
    nxt = next_step_id(scenario, payload.step_id)

    # фиксируем шаг в state
    state = dict(session.state or {})
    log = list(state.get("log", []))
    log.append(
        {
            "step_id": payload.step_id,
            "option_id": payload.option_id,
            "correct": bool(option["correct"]),
            "points": points_awarded,
        }
    )
    state["log"] = log
    state["current_step_id"] = nxt
    session.state = state

    finished = nxt is None
    session.finished = finished

    # обновляем прогресс модуля
    if finished:
        total_max = sum(
            max(o["points"] for o in s["options"]) for s in scenario["steps"]
        )
        pct = (session.score / total_max * 100.0) if total_max else 0.0

        progress = await db.scalar(
            select(Progress).where(
                Progress.user_id == session.user_id,
                Progress.module == session.scenario_id,
            )
        )
        if not progress:
            progress = Progress(
                user_id=session.user_id,
                module=session.scenario_id,
                completion_pct=pct,
                points=session.score,
            )
            db.add(progress)
        else:
            progress.completion_pct = max(progress.completion_pct, pct)
            progress.points = max(progress.points, session.score)

    await db.commit()
    await db.refresh(session)

    return AnswerResponse(
        correct=bool(option["correct"]),
        feedback=option["feedback"],
        points_awarded=points_awarded,
        total_score=session.score,
        next_step_id=nxt,
        finished=finished,
    )


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def session_detail(session_id: int, db: AsyncSession = Depends(get_session)):
    s = await db.get(SimulatorSession, session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return s
