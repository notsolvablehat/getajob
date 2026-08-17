import asyncio

from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright

from app.automation.form_filler import fill_greenhouse_form


async def apply_to_job(
    job: dict, profile: dict, resume_path: str, headless: bool = True
) -> dict:
    """
    Automates the job application process using Playwright.
    Returns: { "success": bool, "failure_reason": str | None, "screenshot_bytes": bytes | None }
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()

        screenshot_bytes = None
        result = {
            "success": False,
            "failure_reason": "Unknown error",
            "screenshot_bytes": None,
        }

        try:
            url = job.get("application_url")
            if not url:
                result["failure_reason"] = "No application URL provided."
                return result

            # Navigate to the job page with a timeout
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # Allow page to settle
            await asyncio.sleep(2)

            from app.config import settings
            if getattr(settings, "PLAYWRIGHT_DEBUG_MODE", False):
                print("DEBUG MODE: Opening Playwright Inspector. Please resume from the inspector to continue.")
                await page.pause()

            # Fill the form
            fill_result = await fill_greenhouse_form(page, profile, resume_path)

            # Take a screenshot of the final state
            screenshot_bytes = await page.screenshot(full_page=True)

            result["success"] = fill_result["success"]
            result["failure_reason"] = fill_result["failure_reason"]
            result["screenshot_bytes"] = screenshot_bytes

        except PlaywrightTimeoutError:
            result["failure_reason"] = "Page load or element wait timeout."
            if not screenshot_bytes:
                try:
                    screenshot_bytes = await page.screenshot(full_page=True)
                    result["screenshot_bytes"] = screenshot_bytes
                except Exception as e:
                    print(f"Screenshot fallback failed: {e}")
        except Exception as e:
            result["failure_reason"] = f"Engine error: {e!s}"
            if not screenshot_bytes:
                try:
                    screenshot_bytes = await page.screenshot(full_page=True)
                    result["screenshot_bytes"] = screenshot_bytes
                except Exception as e:
                    print(f"Screenshot fallback failed: {e}")
        finally:
            await browser.close()

        return result
