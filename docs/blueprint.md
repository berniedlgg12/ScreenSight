# **App Name**: ScreenSight

## Core Features:

- Admin Dashboard: Centralized user interface for monitoring smart TVs across various store locations, displaying real-time status (online/offline, last heartbeat, connection state), store information, and screen IDs, with robust filtering options.
- Smart TV Client Application: A lightweight web page designed to run on smart TVs in fullscreen kiosk mode, responsible for automatically sending heartbeats to the backend and displaying assigned content (text/image/video placeholders).
- Real-time Heartbeat & Status Management: Backend logic leveraging Firebase Functions to efficiently receive and process heartbeats from TV clients, updating their status in Firebase Firestore, and triggering visual alerts on the dashboard when devices go offline.
- Secure Administrator Authentication: Robust administrator login and authentication using Firebase Authentication, providing role-based access control to distinguish between administrative users and viewers.
- Device & Content Configuration: Admins can register new TV devices, assign unique device IDs, link them to specific store locations, rename screens, and configure the content (e.g., text, image URL, video URL) to be displayed on each TV client, all persisted via Firebase Firestore.
- AI-powered Content Suggestion Tool: A generative AI tool designed to assist administrators by suggesting relevant content ideas or text snippets for display on screens, intelligently tailoring suggestions based on criteria like store location, time of day, or pre-defined thematic categories.

## Style Guidelines:

- Color scheme: Dark theme, reflecting a modern, technical monitoring interface designed for long-term viewing with optimal readability and reduced eye strain.
- Primary color: Deep Blue (#334CB3). Chosen for its stable, intelligent, and focused feel, providing excellent contrast in a dark environment and lending itself well to dashboard elements. (HSL: H=220, S=50%, L=40%).
- Background color: Dark Grey-Blue (#161A1F). A subtle and minimal base color derived from the primary hue, ensuring content and critical status indicators stand out clearly without distraction. (HSL: H=220, S=15%, L=10%).
- Accent color: Bright Aqua (#80CDEC). An analogous and highly contrasting color used for highlights, interactive elements, and critical alerts, enhancing visibility and drawing attention where needed. (HSL: H=190, S=70%, L=70%).
- All text: 'Inter', a modern sans-serif typeface, selected for its excellent clarity, legibility, and neutral aesthetic, making it ideal for data-rich interfaces and consistent across all screen sizes.
- Minimalistic, flat vector icons with consistent line weights, emphasizing clear status indication. A simple color-coding system (e.g., green for online, red for offline, yellow for warnings) will be used.
- Admin Dashboard: A clean, responsive grid-based layout utilizing card-like components for individual screen status, prioritizing clear information hierarchy and employing ample negative space for an uncluttered user experience.
- Smart TV Client: A fullscreen, unadorned display solely dedicated to showing assigned content, with any minimal status indicators kept unobtrusive, ensuring a smooth 'kiosk mode' experience without user interaction.
- Subtle and smooth transitions for state changes and filtering actions. Animations are kept minimal, primarily used to reinforce real-time status updates and to gently draw attention to critical alerts.