import { Alert, Platform } from 'react-native';

/**
 * Universal Alert wrapper for React Native and Web
 * 
 * Usage:
 *   UniversalAlert.alert('Title', 'Message', [
 *     { text: 'Cancel', onPress: () => {}, style: 'cancel' },
 *     { text: 'OK', onPress: () => {} }
 *   ])
 */
const UniversalAlert = {
  alert: (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (!buttons || buttons.length === 0) {
        window.alert(`${title}\n\n${message}`);
        return;
      }

      const confirmButton = buttons.find(b => b.style !== 'cancel');
      const cancelButton  = buttons.find(b => b.style === 'cancel');

      if (buttons.length === 1) {
        window.alert(`${title}\n\n${message}`);
        if (buttons[0].onPress) buttons[0].onPress();
      } else {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          if (confirmButton && confirmButton.onPress) confirmButton.onPress();
        } else {
          if (cancelButton && cancelButton.onPress) cancelButton.onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  }
};

export default UniversalAlert;
