# Install Notification Dependencies

Run these commands to install the required packages:

```bash
# Install expo-notifications and expo-device
npm install expo-notifications expo-device

# For Expo managed workflow, also run:
npx expo install expo-notifications expo-device

# If using bare React Native:
npx react-native run-android
```

If you prefer not to install these packages right now, I've created a fallback version of the notification service that works without them.