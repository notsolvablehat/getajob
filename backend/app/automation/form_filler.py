import asyncio
import os
from playwright.async_api import Page

async def fill_greenhouse_form(page: Page, profile: dict, resume_path: str) -> dict:
    """
    Fills a Greenhouse application form using accessible roles and locators.
    Returns {"success": bool, "failure_reason": str | None}
    """
    try:
        # Wait for the form to settle
        await page.wait_for_selector("form", timeout=10000)

        # 1. First Name / Last Name
        full_name = profile.get("full_name", "")
        if full_name:
            parts = full_name.split(" ", 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else ""

            first_name_input = page.get_by_role("textbox", name="First Name", exact=False)
            if await first_name_input.count() > 0:
                await first_name_input.first.fill(first)

            last_name_input = page.get_by_role("textbox", name="Last Name", exact=False)
            if last and await last_name_input.count() > 0:
                await last_name_input.first.fill(last)

        # 2. Email
        email = profile.get("email", "")
        if email:
            email_input = page.get_by_role("textbox", name="Email", exact=False)
            if await email_input.count() > 0:
                await email_input.first.fill(email)

        # 3. Phone
        phone = profile.get("phone", "")
        if phone:
            phone_input = page.get_by_role("textbox", name="Phone", exact=False)
            if await phone_input.count() > 0:
                await phone_input.first.fill(phone)

        # 4. Links (LinkedIn, Website)
        linkedin = profile.get("linkedin_url", "")
        if linkedin:
            li_input = page.get_by_role("textbox", name="LinkedIn Profile", exact=False)
            if await li_input.count() > 0:
                await li_input.first.fill(linkedin)

        website = profile.get("portfolio_url", "")
        if website:
            web_input = page.get_by_role("textbox", name="Website", exact=False)
            if await web_input.count() > 0:
                await web_input.first.fill(website)

        # 5. Upload Resume
        if resume_path:
            resume_container = page.locator("div[aria-labelledby='upload-label-resume']")
            if await resume_container.count() > 0:
                file_input = resume_container.locator("input[type='file']")
                if await file_input.count() > 0:
                    await file_input.first.set_input_files(resume_path)

                    # Wait for upload indicator to confirm it's done
                    filename = os.path.basename(resume_path)
                    try:
                        await page.get_by_text(filename).first.wait_for(state="visible", timeout=15000)
                    except Exception as e:
                        print(f"Warning: Did not see resume filename '{filename}' appear: {e}")
            else:
                # Fallback if the specific div isn't found
                fallback_input = page.locator("input[type='file'][name*='resume' i]")
                if await fallback_input.count() > 0:
                    await fallback_input.first.set_input_files(resume_path)

        # 6. Submit Application
        submit_btn = page.get_by_role("button", name="Submit application", exact=False)
        if await submit_btn.count() > 0:
            # await submit_btn.first.click()
            # Wait a bit for navigation or confirmation to start
            await asyncio.sleep(3)
        else:
            return {"success": False, "failure_reason": "Could not find 'Submit application' button"}

        return {"success": True, "failure_reason": None}

    except Exception as e:
        return {"success": False, "failure_reason": f"Form filling error: {e!s}"}
