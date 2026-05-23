import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export default function Button({ 
  onPress, 
  title, 
  variant = 'primary', 
  loading = false, 
  icon, 
  className = '', 
  textClassName = '',
  disabled = false,
  ...props 
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96); };
  const handlePressOut = () => { scale.value = withSpring(1); };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  
  const baseClasses = "h-[56px] rounded-xl flex-row items-center justify-center px-4 w-full";
  let bgClasses = isPrimary ? "bg-primary shadow-lg shadow-primary/30" : 
                  isSecondary ? "bg-secondary-container" : 
                  isOutline ? "bg-transparent border-2 border-outline" : "bg-transparent";
                  
  let textClasses = textClassName || (isPrimary ? "text-on-primary font-bold text-lg" : 
                    isSecondary ? "text-on-secondary-container font-bold text-lg" :
                    isOutline ? "text-primary font-bold text-lg" : "text-primary font-bold text-lg");

  if (disabled) {
    bgClasses = "bg-surface-variant opacity-60";
    textClasses = "text-on-surface-variant font-bold text-lg";
  }

  return (
    <Animated.View style={animatedStyle} className={className}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={loading || disabled}
        className={`${baseClasses} ${bgClasses}`}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#ffffff' : '#0040a1'} />
        ) : (
          <>
            {icon && <MaterialIcons name={icon} size={24} color={isPrimary ? '#ffffff' : '#0040a1'} className="mr-2" />}
            <Text className={textClasses}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
