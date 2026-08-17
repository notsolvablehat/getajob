from app.apply.schemas import ApplyAllStatusResponse

# In-memory store for task statuses
# Structure: { task_id: {"total_jobs": int, "pending": int, "running": int, "passed": int, "failed": int, "is_complete": bool} }
_TASK_STATUSES: dict[str, dict] = {}


def create_task(task_id: str, job_ids: list[str]):
    _TASK_STATUSES[task_id] = {
        "total_jobs": len(job_ids),
        "pending": list(job_ids),
        "ongoing": [],
        "passed": [],
        "failed": [],
        "is_complete": False,
    }


def update_task_running(task_id: str, job_id: str):
    if task_id in _TASK_STATUSES:
        if job_id in _TASK_STATUSES[task_id]["pending"]:
            _TASK_STATUSES[task_id]["pending"].remove(job_id)
        if job_id not in _TASK_STATUSES[task_id]["ongoing"]:
            _TASK_STATUSES[task_id]["ongoing"].append(job_id)


def update_task_passed(task_id: str, job_id: str):
    if task_id in _TASK_STATUSES:
        if job_id in _TASK_STATUSES[task_id]["ongoing"]:
            _TASK_STATUSES[task_id]["ongoing"].remove(job_id)
        if job_id not in _TASK_STATUSES[task_id]["passed"]:
            _TASK_STATUSES[task_id]["passed"].append(job_id)


def update_task_failed(task_id: str, job_id: str):
    if task_id in _TASK_STATUSES:
        if job_id in _TASK_STATUSES[task_id]["ongoing"]:
            _TASK_STATUSES[task_id]["ongoing"].remove(job_id)
        if job_id not in _TASK_STATUSES[task_id]["failed"]:
            _TASK_STATUSES[task_id]["failed"].append(job_id)


def complete_task(task_id: str):
    if task_id in _TASK_STATUSES:
        _TASK_STATUSES[task_id]["is_complete"] = True


def get_task_status(task_id: str) -> ApplyAllStatusResponse | None:
    status = _TASK_STATUSES.get(task_id)
    if status:
        return ApplyAllStatusResponse(
            task_id=task_id,
            total_jobs=status["total_jobs"],
            pending=status["pending"],
            ongoing=status["ongoing"],
            passed=status["passed"],
            failed=status["failed"],
            is_complete=status["is_complete"],
        )
    return None
