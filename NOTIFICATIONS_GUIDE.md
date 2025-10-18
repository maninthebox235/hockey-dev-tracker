# Toast Notifications Guide

Your Hockey Development Tracker now has a comprehensive toast notification system using Sonner.

## Quick Start

Import the notification utilities:

```typescript
import { notify, notifications } from "@/lib/notifications";
```

## Basic Usage

### Simple Notifications

```typescript
// Success
notify.success("Operation completed");
notify.success("Player Added", "John Doe has been added to the roster");

// Error
notify.error("Something went wrong");
notify.error("Upload Failed", "File size exceeds limit");

// Info
notify.info("Processing video");
notify.info("Analysis Started", "Your video is being analyzed");

// Warning
notify.warning("Connection unstable");
notify.warning("Low Storage", "You're running out of storage space");
```

### Loading Notifications

```typescript
// Show loading toast
const dismiss = notify.loading("Uploading video...", "Please wait");

// Later, dismiss it
dismiss();
```

### Promise Notifications

Automatically show loading → success/error based on promise result:

```typescript
notify.promise(
  uploadVideo(file),
  {
    loading: "Uploading video...",
    success: "Video uploaded successfully!",
    error: "Upload failed. Please try again.",
  }
);

// With dynamic messages
notify.promise(
  createPlayer(data),
  {
    loading: "Creating player...",
    success: (player) => `${player.name} added to roster`,
    error: (err) => `Failed: ${err.message}`,
  }
);
```

### Action Notifications

Toast with a clickable action button:

```typescript
notify.action(
  "Video analysis complete",
  "View Results",
  () => {
    window.location.href = `/videos/${videoId}`;
  },
  "Click to see detailed analysis"
);
```

## Pre-configured Notifications

Use ready-made notifications for common scenarios:

### Player Notifications

```typescript
notifications.playerAdded("John Doe");
notifications.playerUpdated("John Doe");
notifications.playerDeleted("John Doe");
```

### Season Notifications

```typescript
notifications.seasonCreated("2024-25 Season");
notifications.seasonActivated("2024-25 Season");
```

### Video Notifications

```typescript
const dismiss = notifications.videoUploading();
notifications.videoUploaded("Practice Session 1");
notifications.videoUploadFailed("File too large");
```

### Analysis Notifications

```typescript
notifications.analysisStarted("Practice Session 1");
notifications.analysisComplete("Practice Session 1");
notifications.analysisFailed("Processing error");
```

### Feedback Notifications

```typescript
notifications.feedbackGenerated();
```

### General Notifications

```typescript
notifications.saveSuccess();
notifications.saveError("Database connection failed");
notifications.copied("Video URL");
```

### Delete Confirmation

```typescript
notifications.deleteConfirm("Player #23", () => {
  // Delete logic here
  deletePlayer(playerId);
});
```

### Network Status

```typescript
notifications.offline();
notifications.online();
```

## Customization

### Duration

```typescript
toast.success("Quick message", { duration: 2000 }); // 2 seconds
toast.error("Important error", { duration: 10000 }); // 10 seconds
```

### Position

Configure in `App.tsx`:

```typescript
<Toaster position="top-right" />
<Toaster position="bottom-center" />
```

### Styling

Toasts automatically use your app's theme colors. They support:
- Dark/light mode
- Primary color accents
- Glass morphism effects

## Examples in Your App

### Video Upload with Progress

```typescript
const handleUpload = async (file: File) => {
  const dismiss = notifications.videoUploading();
  
  try {
    await uploadVideo(file);
    dismiss();
    notifications.videoUploaded(file.name);
  } catch (error) {
    dismiss();
    notifications.videoUploadFailed(error.message);
  }
};
```

### Analysis Workflow

```typescript
const startAnalysis = async (videoId: string, title: string) => {
  notifications.analysisStarted(title);
  
  try {
    await analyzeVideo(videoId);
    notifications.analysisComplete(title);
    notifications.feedbackGenerated();
  } catch (error) {
    notifications.analysisFailed(error.message);
  }
};
```

### Form Submission

```typescript
const handleSubmit = async (data: PlayerData) => {
  try {
    const player = await createPlayer(data);
    notifications.playerAdded(player.name);
  } catch (error) {
    notify.error("Failed to create player", error.message);
  }
};
```

### Copy to Clipboard

```typescript
const copyVideoUrl = (url: string) => {
  navigator.clipboard.writeText(url);
  notifications.copied("Video URL");
};
```

## Best Practices

1. **Be Specific**: Use descriptive messages
   - ❌ "Success"
   - ✅ "Player John Doe added to roster"

2. **Provide Context**: Add descriptions for important actions
   ```typescript
   notify.success("Analysis Complete", "View detailed metrics in the video page");
   ```

3. **Handle Errors Gracefully**: Show helpful error messages
   ```typescript
   notify.error("Upload Failed", "File must be under 1GB. Try compressing your video.");
   ```

4. **Use Loading States**: Show progress for long operations
   ```typescript
   const dismiss = notify.loading("Processing...");
   // ... do work ...
   dismiss();
   ```

5. **Don't Spam**: Avoid showing too many toasts at once
   ```typescript
   notify.dismissAll(); // Clear all before showing new important toast
   ```

## Accessibility

Sonner toasts are fully accessible:
- Screen reader announcements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management
- ARIA labels

## API Reference

### `notify` Object

| Method | Parameters | Description |
|--------|-----------|-------------|
| `success(message, description?)` | string, string? | Green success toast |
| `error(message, description?)` | string, string? | Red error toast |
| `info(message, description?)` | string, string? | Blue info toast |
| `warning(message, description?)` | string, string? | Yellow warning toast |
| `loading(message, description?)` | string, string? | Loading spinner toast |
| `promise(promise, messages)` | Promise, object | Auto-updating toast |
| `action(message, label, fn, desc?)` | string, string, function, string? | Toast with button |
| `dismissAll()` | - | Dismiss all toasts |

### `notifications` Object

Pre-configured notifications for common scenarios. See examples above.

