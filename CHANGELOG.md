# Changelog

All notable changes to the Lockeroom Schedule Builder Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Recurring Coach Substitution:** Added option in the swap dialog to apply a coach substitution to future weeks for a specific session (Just this session, Next 4 weeks, Next 8 weeks, All scheduled future weeks).
- **Interactive Preference Heat Map:** Replaced the old preferences table with a color-coded interactive heat map grid for managers to easily view coach availability blocks.
- **Coach Preference Pills:** Replaced heat map segments with detailed coach preference pills that display "Soft", "Hard", or "Preferred" availability.
- **Carry-Forward Preferences:** The heat map now respects and uses effective carry-forward preferences from previous periods.
- **Smart Swap Logic:** Improved swap coach suggestions by:
  - Enforcing a maximum 10-hour daily span for coaches.
  - Adding time window collision checks (excluding coaches working within 39 minutes).
  - Applying state-based location restrictions (e.g. VIC vs NSW).

### Changed
- **Session Styling:** Applied tinted backgrounds to session cards based on their class type for better visual distinction.
- **Coach Slot UI:** Normal coach slots now have a white background for better readability.
- **Compact UI:** Tightened the spacing in the Swap/Assign dropdowns to fit more information efficiently.

### Fixed
- **Swap Menu Z-Index:** Elevated the z-index when the swap menu is open to prevent clipping by other grid elements.
- **Staff Summary Strip:** Filtered out non-coaching roles from appearing in the staff summary strip count.
- **Swap Request Priority:** Swap request coach slots are now positioned first in the list of assigned coaches for better visibility.
