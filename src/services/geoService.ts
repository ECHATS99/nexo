export interface GeoData {
  ip: string;
  country_name: string;
  country_code: string;
  city: string;
  region: string;
  timezone: string;
  currency: string;
}

export const geoService = {
  detectLocation: async (): Promise<GeoData> => {
    const fallback: GeoData = {
      ip: "127.0.0.1",
      country_name: "Congo",
      country_code: "CG",
      city: "Brazzaville",
      region: "Brazzaville",
      timezone: "Africa/Brazzaville",
      currency: "XAF"
    };

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error("Failed to fetch location");
      const data = await response.json();
      return { ...fallback, ...data };
    } catch (error) {
      console.warn("Geo detect failed, using fallback:", error);
      return fallback;
    }
  },

  getFlagEmoji: (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
};

export const currencyService = {
  getCurrencyConfig: (countryCode: string) => {
    const config: Record<string, { code: string, symbol: string }> = {
      'CG': { code: 'XAF', symbol: 'FCFA' },
      'CM': { code: 'XAF', symbol: 'FCFA' },
      'CI': { code: 'XOF', symbol: 'FCFA' },
      'SN': { code: 'XOF', symbol: 'FCFA' },
      'FR': { code: 'EUR', symbol: '€' },
      'BE': { code: 'EUR', symbol: '€' },
      'US': { code: 'USD', symbol: '$' },
      'MA': { code: 'MAD', symbol: 'MAD' },
      'DZ': { code: 'DZD', symbol: 'DZD' },
      'TN': { code: 'TND', symbol: 'TND' },
      'CA': { code: 'CAD', symbol: '$' },
    };
    return config[countryCode.toUpperCase()] || { code: 'USD', symbol: '$' };
  },

  formatPrice: (amount: number, countryCode: string) => {
    const { code, symbol } = currencyService.getCurrencyConfig(countryCode);
    
    // In a real app we'd have live exchange rates.
    // For now, we display the raw amount with the local symbol or mock conversion.
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(amount).replace(code, symbol);
  }
};
