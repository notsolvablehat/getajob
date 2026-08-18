import asyncio
import os
import re
from playwright.async_api import Page

async def fill_greenhouse_form(page: Page, profile: dict, resume_path: str) -> dict:
    """
    Fills a Greenhouse application form using accessible roles and locators.
    Returns {"success": bool, "failure_reason": str | None}
    """
    try:
        # 1. Try to wait for the standard form tag, but don't fail if it doesn't appear quickly
        try:
            await page.wait_for_selector("form", timeout=5000)
        except Exception:
            pass # Fallback to waiting for the First Name input

        # 2. Wait for the First Name input as a reliable indicator that the form is loaded
        first_name_regex = re.compile(r"(first|given)?\s*name", re.IGNORECASE)
        first_name_input = page.get_by_role("textbox", name=first_name_regex)
        await first_name_input.first.wait_for(state="visible", timeout=15000)

        # 3. Fill First Name / Last Name
        full_name = profile.get("full_name", "")
        if full_name:
            parts = full_name.split(" ", 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else ""

            if await first_name_input.count() > 0:
                await first_name_input.first.fill(first)

            last_name_regex = re.compile(r"(last|family|surname)\s*name", re.IGNORECASE)
            last_name_input = page.get_by_role("textbox", name=last_name_regex)
            if last and await last_name_input.count() > 0:
                await last_name_input.first.fill(last)

        # 4. Email
        email = profile.get("email", "")
        if email:
            email_regex = re.compile(r"e?-?mail", re.IGNORECASE)
            email_input = page.get_by_role("textbox", name=email_regex)
            if await email_input.count() > 0:
                await email_input.first.fill(email)

        # 5. Phone
        phone = profile.get("phone", "")
        if phone:
            phone_regex = re.compile(r"phone|mobile|cell", re.IGNORECASE)
            phone_input = page.get_by_role("textbox", name=phone_regex)
            if await phone_input.count() > 0:
                await phone_input.first.fill(phone)

        # 6. Links (LinkedIn, Website)
        linkedin = profile.get("linkedin_url", "")
        if linkedin:
            li_regex = re.compile(r"linkedin", re.IGNORECASE)
            li_input = page.get_by_role("textbox", name=li_regex)
            if await li_input.count() > 0:
                await li_input.first.fill(linkedin)

        website = profile.get("portfolio_url", "")
        if website:
            web_regex = re.compile(r"website|portfolio|github|link", re.IGNORECASE)
            web_input = page.get_by_role("textbox", name=web_regex)
            if await web_input.count() > 0:
                await web_input.first.fill(website)

        # 7. Upload Resume
        if resume_path:
            # Fallback strategy for resume inputs
            resume_uploaded = False
            
            # Strategy A: Standard Greenhouse aria-labelledby
            resume_container = page.locator("div[aria-labelledby='upload-label-resume']")
            if await resume_container.count() > 0:
                file_input = resume_container.locator("input[type='file']")
                if await file_input.count() > 0:
                    await file_input.first.set_input_files(resume_path)
                    resume_uploaded = True

            # Strategy B: Any file input containing 'resume' or 'cv'
            if not resume_uploaded:
                fallback_input = page.locator("input[type='file'][name*='resume' i], input[type='file'][name*='cv' i]")
                if await fallback_input.count() > 0:
                    await fallback_input.first.set_input_files(resume_path)
                    resume_uploaded = True
                    
            # Wait for upload indicator to confirm it's done
            if resume_uploaded:
                filename = os.path.basename(resume_path)
                try:
                    await page.get_by_text(filename).first.wait_for(state="visible", timeout=15000)
                except Exception as e:
                    print(f"Warning: Did not see resume filename '{filename}' appear: {e}")

        # 8. Submit Application
        submit_regex = re.compile(r"submit( application)?|apply", re.IGNORECASE)
        submit_btn = page.get_by_role("button", name=submit_regex)
        if await submit_btn.count() > 0:
            # await submit_btn.first.click()
            # Wait a bit for navigation or confirmation to start
            await asyncio.sleep(3)
        else:
            return {"success": False, "failure_reason": "Could not find 'Submit application' button"}

        return {"success": True, "failure_reason": None}

    except Exception as e:
        return {"success": False, "failure_reason": f"Form filling error: {e!s}"}
