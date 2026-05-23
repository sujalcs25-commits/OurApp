import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Input({
  label,
  error,
  icon,
  secureTextEntry,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View className={`mb-4 w-full ${className}`}>
      {label && (
        <Text className="text-on-surface-variant text-xs font-semibold mb-1.5 uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View 
        className={`flex-row items-center bg-surface-container-highest rounded-xl px-4 py-1 h-[56px] border-2 transition-colors ${
          error ? 'border-error bg-error-container/20' : 
          isFocused ? 'border-primary bg-surface' : 'border-transparent'
        }`}
      >
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={20} 
            color={error ? '#ba1a1a' : isFocused ? '#0040a1' : '#57657a'} 
            className="mr-3" 
          />
        )}
        <TextInput
          className="flex-1 text-on-surface text-base font-medium p-0"
          placeholderTextColor="#737785"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
            className="p-2 -mr-2"
          >
            <MaterialIcons 
              name={isPasswordVisible ? 'visibility-off' : 'visibility'} 
              size={20} 
              color="#57657a" 
            />
          </TouchableOpacity>
        )}
        {error && !secureTextEntry && (
          <MaterialIcons name="error" size={20} color="#ba1a1a" className="ml-2" />
        )}
      </View>
      {error && (
        <Text className="text-error text-xs font-medium mt-1.5 ml-1">{error}</Text>
      )}
    </View>
  );
}
