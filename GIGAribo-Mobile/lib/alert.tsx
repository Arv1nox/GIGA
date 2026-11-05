import { Alert as NativeAlert, Platform, type AlertButton } from 'react-native';

/**
 * Drop-in replacement for react-native's Alert.
 * On phones it uses the normal native alert. On web, Alert.alert does nothing,
 * so this falls back to the browser's alert / confirm dialogs.
 */
function alert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    NativeAlert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const cancel = buttons?.find((b) => b.style === 'cancel');
  const actions = buttons?.filter((b) => b.style !== 'cancel') ?? [];

  if (cancel && actions.length > 0) {
    // Two-choice dialog: OK runs the action, Cancel runs the cancel button.
    if (window.confirm(text)) actions[actions.length - 1].onPress?.();
    else cancel.onPress?.();
    return;
  }

  window.alert(text);
  actions[actions.length - 1]?.onPress?.();
}

export const Alert = { alert };