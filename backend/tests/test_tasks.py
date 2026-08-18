import pytest
from app.apply import tasks

def test_task_lifecycle():
    # Clear any global state if necessary, but we can just use a unique ID
    task_id = "test-task-123"
    job_ids = ["job1", "job2"]

    # 1. Create task
    tasks.create_task(task_id, job_ids)
    status = tasks.get_task_status(task_id)
    assert status is not None
    assert status.total_jobs == 2
    assert len(status.pending) == 2
    assert not status.is_complete

    # 2. Update to running
    tasks.update_task_running(task_id, "job1")
    status = tasks.get_task_status(task_id)
    assert "job1" in status.ongoing
    assert "job1" not in status.pending

    # 3. Update to passed
    tasks.update_task_passed(task_id, "job1")
    status = tasks.get_task_status(task_id)
    assert "job1" in status.passed
    assert "job1" not in status.ongoing

    # 4. Update to failed
    tasks.update_task_running(task_id, "job2")
    tasks.update_task_failed(task_id, "job2")
    status = tasks.get_task_status(task_id)
    assert "job2" in status.failed
    assert "job2" not in status.ongoing

    # 5. Complete task
    tasks.complete_task(task_id)
    status = tasks.get_task_status(task_id)
    assert status.is_complete
