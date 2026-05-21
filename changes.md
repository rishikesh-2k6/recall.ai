# Changelog

Here is a summary of the recent changes made to the project:

## UI & Frontend Improvements
- **Branding Polish:** Replaced placeholder "8x Template" branding with the "Recall.ai" logo in both the navigation bar and footer.
- **Sidebar Enhancements:**
  - Implemented a collapsible sidebar for better use of screen real estate.
  - Fixed sidebar alignment issues.
- **Theme & Styling:**
  - Added a global light/dark theme toggle.
  - Removed duplicate theme toggles.
  - Polished scrollbar styles globally.
- **Settings Modal:** 
  - Added a fully interactive Settings modal.
  - Cleaned up the settings tabs and integrated an account management area (including a "Danger Zone" for account deletion).

## Backend & Core Features
- **Audio Processing Engine:**
  - Implemented the real audio transcription and analysis backend in `app/api/process-audio/route.ts`.
  - Updated `hooks/useProcessAudio.ts` and necessary environment variables (`.env.example`) to support real transcription.
- **Documentation:**
  - Created a comprehensive `BACKEND_BLUEPRINT.md` as an implementation guide for teammates detailing the backend architecture.
