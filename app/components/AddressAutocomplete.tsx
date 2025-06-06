"use client";

import { useEffect, useRef } from "react";

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    street: string;
    city: string;
    zip: string;
  }) => void;
}

interface Place {
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address?: string;
  name?: string;
}

interface Autocomplete {
  addListener(event: string, callback: () => void): void;
  getPlace(): Place;
}

interface GoogleMaps {
  maps: {
    places: {
      Autocomplete: {
        new (
          input: HTMLInputElement,
          options?: {
            types?: string[];
            componentRestrictions?: { country: string };
          }
        ): Autocomplete;
      };
    };
    event: {
      clearInstanceListeners(instance: Autocomplete): void;
    };
  };
}

declare global {
  interface Window {
    google: GoogleMaps;
  }
}

let isScriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

const loadGoogleMapsScript = () => {
  if (isScriptLoaded) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isScriptLoaded = true;
      resolve();
    };
    script.onerror = reject;

    // Add script to head
    const head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(script);
  });

  return scriptLoadPromise;
};

const waitForGoogleMaps = () => {
  return new Promise<void>((resolve) => {
    if (window.google?.maps?.places?.Autocomplete) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 10000);
    }
  });
};

export default function AddressAutocomplete({
  onAddressSelect,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<Autocomplete | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAutocomplete = async () => {
      try {
        console.log("Starting to initialize autocomplete");
        await loadGoogleMapsScript();
        console.log("Google Maps script loaded");
        await waitForGoogleMaps();
        console.log("Google Maps API ready");

        if (!isMounted || !inputRef.current) {
          console.log("Component unmounted or input not found");
          return;
        }

        if (!window.google?.maps?.places?.Autocomplete) {
          throw new Error("Google Maps Places API not loaded properly");
        }

        console.log("Creating Autocomplete");
        // Create the Autocomplete
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "ES" },
          }
        );

        autocompleteRef.current = autocomplete;
        console.log("Autocomplete created");

        // Listen for place selection
        const handlePlaceChanged = () => {
          console.log("Place changed event triggered");
          const place = autocomplete.getPlace();
          console.log("Place details:", place);

          if (place?.address_components) {
            let street = "";
            let city = "";
            let zip = "";

            for (const component of place.address_components) {
              const types = component.types;
              console.log("Component:", component.long_name, types);

              if (types.includes("route") || types.includes("street_number")) {
                street = street
                  ? `${street} ${component.long_name}`
                  : component.long_name;
              }
              if (
                types.includes("locality") ||
                types.includes("administrative_area_level_2")
              ) {
                city = component.long_name;
              }
              if (types.includes("postal_code")) {
                zip = component.long_name;
              }
            }

            // If we have a formatted address but no street, use the formatted address
            if (!street && place.formatted_address) {
              street = place.formatted_address;
            }

            console.log("Parsed address:", { street, city, zip });

            // Call onAddressSelect with the parsed address
            onAddressSelect({
              street: street || "",
              city: city || "",
              zip: zip || "",
            });
          }
        };

        // Add the event listener
        console.log("Adding place_changed event listener");
        autocomplete.addListener("place_changed", handlePlaceChanged);

        // Cleanup function
        return () => {
          console.log("Cleaning up event listener");
          if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(
              autocompleteRef.current
            );
          }
        };
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initializeAutocomplete();

    return () => {
      console.log("Component unmounting");
      isMounted = false;
    };
  }, [onAddressSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
      placeholder="Enter your address"
    />
  );
}
