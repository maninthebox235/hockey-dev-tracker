import { toast } from "sonner";

/**
 * Custom notification utilities for consistent toast messages
 * Uses Sonner for beautiful, accessible toast notifications
 */

export const notify = {
  /**
   * Success notification - green checkmark
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Error notification - red X
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },

  /**
   * Info notification - blue info icon
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Warning notification - yellow warning icon
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Loading notification - spinner
   * Returns a function to dismiss the loading toast
   */
  loading: (message: string, description?: string) => {
    const id = toast.loading(message, {
      description,
    });
    return () => toast.dismiss(id);
  },

  /**
   * Promise notification - automatically shows loading, success, or error
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Custom notification with action button
   */
  action: (
    message: string,
    actionLabel: string,
    actionFn: () => void,
    description?: string
  ) => {
    toast(message, {
      description,
      action: {
        label: actionLabel,
        onClick: actionFn,
      },
      duration: 6000,
    });
  },

  /**
   * Dismiss all notifications
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

/**
 * Pre-configured notifications for common scenarios
 */
export const notifications = {
  // Player notifications
  playerAdded: (name: string) => 
    notify.success("Player Added", `${name} has been added to the roster`),
  
  playerUpdated: (name: string) => 
    notify.success("Player Updated", `${name}'s information has been updated`),
  
  playerDeleted: (name: string) => 
    notify.success("Player Removed", `${name} has been removed from the roster`),

  // Season notifications
  seasonCreated: (name: string) => 
    notify.success("Season Created", `${name} has been created`),
  
  seasonActivated: (name: string) => 
    notify.success("Season Activated", `${name} is now the active season`),

  // Video notifications
  videoUploading: () => 
    notify.loading("Uploading Video", "Please wait while your video is being uploaded..."),
  
  videoUploaded: (title: string) => 
    notify.success("Video Uploaded", `${title} has been uploaded successfully`),
  
  videoUploadFailed: (error: string) => 
    notify.error("Upload Failed", error),

  // Analysis notifications
  analysisStarted: (videoTitle: string) => 
    notify.info("Analysis Started", `Processing ${videoTitle}...`),
  
  analysisComplete: (videoTitle: string) => 
    notify.success("Analysis Complete", `${videoTitle} has been analyzed`),
  
  analysisFailed: (error: string) => 
    notify.error("Analysis Failed", error),

  // Feedback notifications
  feedbackGenerated: () => 
    notify.success("Feedback Generated", "AI coaching feedback is ready to view"),

  // General notifications
  saveSuccess: () => 
    notify.success("Saved", "Your changes have been saved"),
  
  saveError: (error?: string) => 
    notify.error("Save Failed", error || "Unable to save changes. Please try again."),
  
  deleteConfirm: (itemName: string, onConfirm: () => void) => 
    notify.action(
      `Delete ${itemName}?`,
      "Confirm",
      onConfirm,
      "This action cannot be undone"
    ),

  // Network notifications
  offline: () => 
    notify.warning("No Internet Connection", "Some features may not be available"),
  
  online: () => 
    notify.success("Back Online", "Connection restored"),

  // Copy notifications
  copied: (what: string = "Text") => 
    notify.success(`${what} Copied`, "Copied to clipboard"),
};

