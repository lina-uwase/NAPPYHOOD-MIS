'use client';

import React, { useState, useEffect } from 'react';

interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  // East Africa (most common for this app)
  { code: 'RW', dialCode: '+250', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'UG', dialCode: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'TZ', dialCode: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'ET', dialCode: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'SS', dialCode: '+211', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'BI', dialCode: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CD', dialCode: '+243', name: 'DR Congo', flag: '🇨🇩' },
  { code: 'DJ', dialCode: '+253', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'ER', dialCode: '+291', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'SO', dialCode: '+252', name: 'Somalia', flag: '🇸🇴' },
  
  // Southern Africa
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ZW', dialCode: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'ZM', dialCode: '+260', name: 'Zambia', flag: '🇿🇲' },
  { code: 'MW', dialCode: '+265', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MZ', dialCode: '+258', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'BW', dialCode: '+267', name: 'Botswana', flag: '🇧🇼' },
  { code: 'NA', dialCode: '+264', name: 'Namibia', flag: '🇳🇦' },
  { code: 'LS', dialCode: '+266', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'SZ', dialCode: '+268', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'AO', dialCode: '+244', name: 'Angola', flag: '🇦🇴' },
  
  // West Africa
  { code: 'NG', dialCode: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', dialCode: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: 'SN', dialCode: '+221', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CI', dialCode: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'CM', dialCode: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'ML', dialCode: '+223', name: 'Mali', flag: '🇲🇱' },
  { code: 'BF', dialCode: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'NE', dialCode: '+227', name: 'Niger', flag: '🇳🇪' },
  { code: 'TD', dialCode: '+235', name: 'Chad', flag: '🇹🇩' },
  { code: 'GN', dialCode: '+224', name: 'Guinea', flag: '🇬🇳' },
  { code: 'TG', dialCode: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: 'BJ', dialCode: '+229', name: 'Benin', flag: '🇧🇯' },
  { code: 'LR', dialCode: '+231', name: 'Liberia', flag: '🇱🇷' },
  { code: 'SL', dialCode: '+232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'GM', dialCode: '+220', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GW', dialCode: '+245', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'MR', dialCode: '+222', name: 'Mauritania', flag: '🇲🇷' },
  
  // Central Africa
  { code: 'CF', dialCode: '+236', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'CG', dialCode: '+242', name: 'Republic of Congo', flag: '🇨🇬' },
  { code: 'GA', dialCode: '+241', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GQ', dialCode: '+240', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ST', dialCode: '+239', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  
  // North Africa
  { code: 'EG', dialCode: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: 'LY', dialCode: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: 'TN', dialCode: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'DZ', dialCode: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: 'MA', dialCode: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: 'SD', dialCode: '+249', name: 'Sudan', flag: '🇸🇩' },
  
  // Americas
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'MX', dialCode: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', dialCode: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', dialCode: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', dialCode: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', dialCode: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: 'VE', dialCode: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CL', dialCode: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: 'EC', dialCode: '+593', name: 'Ecuador', flag: '🇪🇨' },
  
  // Europe
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', dialCode: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', dialCode: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', dialCode: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', dialCode: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', dialCode: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: 'SE', dialCode: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', dialCode: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', dialCode: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', dialCode: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', dialCode: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', dialCode: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', dialCode: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: 'IE', dialCode: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: 'RU', dialCode: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: 'TR', dialCode: '+90', name: 'Turkey', flag: '🇹🇷' },
  
  // Asia
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'CN', dialCode: '+86', name: 'China', flag: '🇨🇳' },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', dialCode: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', dialCode: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'TH', dialCode: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'IL', dialCode: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: 'IQ', dialCode: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IR', dialCode: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: 'AF', dialCode: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  
  // Oceania
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'FJ', dialCode: '+679', name: 'Fiji', flag: '🇫🇯' },
  { code: 'PG', dialCode: '+675', name: 'Papua New Guinea', flag: '🇵🇬' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder,
  error,
  required = false,
  className = '',
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // Default to Rwanda
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Parse existing phone value on mount or when value changes externally
  useEffect(() => {
    if (value) {
      // Check if value already has a country code
      const matchingCountry = COUNTRY_CODES.find(country => 
        value.startsWith(country.dialCode)
      );
      
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setPhoneNumber(value.replace(matchingCountry.dialCode, '').trim());
      } else if (value.startsWith('+')) {
        // Has + but unknown country code, extract it
        const dialCodeMatch = value.match(/^\+(\d{1,4})/);
        if (dialCodeMatch) {
          const dialCode = `+${dialCodeMatch[1]}`;
          const foundCountry = COUNTRY_CODES.find(c => c.dialCode === dialCode);
          if (foundCountry) {
            setSelectedCountry(foundCountry);
            setPhoneNumber(value.replace(dialCode, '').trim());
          } else {
            // Unknown country code, keep as is
            setPhoneNumber(value);
          }
        } else {
          setPhoneNumber(value);
        }
      } else {
        // No country code, assume local format
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber('');
    }
  }, [value]);

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setCountrySearch(''); // Clear search when selecting
    // Update parent with new country code + phone number
    const fullNumber = phoneNumber.trim() 
      ? `${country.dialCode}${phoneNumber.trim()}`
      : country.dialCode;
    onChange(fullNumber);
  };

  // Filter countries based on search query
  const filteredCountries = countrySearch.trim()
    ? COUNTRY_CODES.filter(country =>
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.dialCode.includes(countrySearch) ||
        country.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRY_CODES;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits, spaces, hyphens, and parentheses
    const cleaned = input.replace(/[^\d\s\-()]/g, '');
    setPhoneNumber(cleaned);
    
    // Update parent with full number
    const fullNumber = cleaned.trim() 
      ? `${selectedCountry.dialCode}${cleaned.trim()}`
      : selectedCountry.dialCode;
    onChange(fullNumber);
  };

  const validatePhoneNumber = (): boolean => {
    if (!required && !phoneNumber.trim()) {
      return true; // Optional field, empty is valid
    }

    if (required && !phoneNumber.trim()) {
      return false;
    }

    // Basic validation: should have at least 7 digits (excluding country code)
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      return false;
    }

    // Country-specific validation for Rwanda
    if (selectedCountry.code === 'RW') {
      // Rwanda: should start with 7 and have 9 digits total
      const rwandaDigits = phoneNumber.replace(/\D/g, '');
      return rwandaDigits.length === 9 && rwandaDigits.startsWith('7');
    }

    // General validation: 7-15 digits
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  return (
    <div className={className}>
      <div className="flex">
        {/* Country Code Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                setShowCountryDropdown(!showCountryDropdown);
                if (!showCountryDropdown) {
                  setCountrySearch(''); // Clear search when opening
                }
              }
            }}
            disabled={disabled}
            className={`flex items-center px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span className="mr-2 text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <svg
              className={`ml-2 w-4 h-4 transition-transform ${
                showCountryDropdown ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Country Dropdown */}
          {showCountryDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setShowCountryDropdown(false);
                  setCountrySearch(''); // Clear search when closing
                }}
              />
              <div className="absolute z-20 mt-1 bg-white border border-gray-300 rounded-md shadow-lg w-64">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A8621]"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking search
                    autoFocus
                  />
                </div>
                
                {/* Country List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountryChange(country)}
                        className={`w-full flex items-center px-4 py-2 hover:bg-gray-50 ${
                          selectedCountry.code === country.code ? 'bg-green-50' : ''
                        }`}
                      >
                        <span className="mr-3 text-lg">{country.flag}</span>
                        <span className="flex-1 text-left text-sm font-medium">
                          {country.name}
                        </span>
                        <span className="text-sm text-gray-600">{country.dialCode}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No countries found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder || `Enter phone number`}
          className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#5A8621] ${
            error ? 'border-red-500' : 'border-gray-300 border-l-0'
          } ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {!error && phoneNumber && !validatePhoneNumber() && (
        <p className="mt-1 text-sm text-yellow-600">
          Please enter a valid phone number
        </p>
      )}
    </div>
  );
}

// Export validation function for use in forms
export function validatePhoneNumber(phone: string, required: boolean = false): string | null {
  if (!required && !phone.trim()) {
    return null; // Optional field, empty is valid
  }

  if (required && !phone.trim()) {
    return 'Phone number is required';
  }

  // Check if phone has a country code
  if (!phone.startsWith('+')) {
    return 'Phone number must include country code';
  }

  // Extract country code and number
  const match = phone.match(/^\+(\d{1,4})(.+)$/);
  if (!match) {
    return 'Invalid phone number format';
  }

  const [, dialCode, number] = match;
  const digitsOnly = number.replace(/\D/g, '');

  // Basic validation: should have at least 7 digits
  if (digitsOnly.length < 7) {
    return 'Phone number is too short';
  }

  if (digitsOnly.length > 15) {
    return 'Phone number is too long';
  }

  // Rwanda-specific validation
  if (dialCode === '250') {
    if (digitsOnly.length !== 9 || !digitsOnly.startsWith('7')) {
      return 'Rwanda phone numbers must be 9 digits starting with 7';
    }
  }

  return null; // Valid
}
