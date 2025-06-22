'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  getAuth,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export default function CreditCardPage() {
  return (
    <div className="light bg-white min-h-screen">
      <Elements stripe={stripePromise}>
        <CreditCardForm />
      </Elements>
    </div>
  );
}

function CreditCardForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [user, setUser] = useState<User | null>(null);
  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setBillingEmail(u?.email || '');
    });
    return () => unsubscribe();
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query) return;
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&autocomplete=true&types=address&limit=5&country=ca,us`
    );
    const data = await res.json();
    setSuggestions(data.features);
  };

  const getFieldFromContext = (context: any[], type: string) => {
    const item = context?.find((c) => c.id.startsWith(type));
    return item?.text || '';
  };

  const getCountryCode = (countryName: string): string => {
    const code = countries.getAlpha2Code(countryName, 'en');
    return code || 'CA';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !user || !selectedPlace) {
      setStatus('Stripe, user, or address not ready.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const context = selectedPlace.context || [];
    const countryName = getFieldFromContext(context, 'country') || 'Canada';
    const country = getCountryCode(countryName);

    const address = {
      line1: selectedPlace.place_name?.split(',')[0] || '',
      line2: '',
      city: getFieldFromContext(context, 'place'),
      state: getFieldFromContext(context, 'region'),
      postal_code: getFieldFromContext(context, 'postcode'),
      country,
    };

    setStatus('Creating payment method...');

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: billingName,
        email: billingEmail,
        address,
      },
    });

    if (error || !paymentMethod) {
      setStatus(error?.message || 'Failed to create payment method.');
      return;
    }

    await setDoc(doc(db, 'users', user.uid), {
      paymentMethodId: paymentMethod.id,
      cardBrand: paymentMethod.card?.brand,
      cardLast4: paymentMethod.card?.last4,
      billingName,
      billingEmail,
      billingAddress: address,
    }, { merge: true });

    setStatus('✅ Card and billing address saved!');
  };

  return (
    <div className="max-w-md mx-auto p-6 text-gray-900">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Credit Card</h2>
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <input
          type="text"
          value={billingName}
          onChange={(e) => setBillingName(e.target.value)}
          placeholder="Billing Name"
          className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-500"
          required
        />
        <input
          type="email"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
          placeholder="Billing Email"
          className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-500"
          required
        />

        <div>
          <label className="block text-sm text-gray-600 mb-1">Billing Address</label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            placeholder="Start typing your address..."
            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-500"
            required
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
              {suggestions.map((sug, idx) => (
                <li
                  key={idx}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900"
                  onClick={() => {
                    setSelectedPlace(sug);
                    setAddressInput(sug.place_name);
                    setSuggestions([]);
                  }}
                >
                  {sug.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <CardElement className="p-3 border border-gray-300 rounded bg-white" />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
          disabled={!selectedPlace || !stripe}
        >
          Save Card
        </button>
        <p className="text-sm text-gray-700">{status}</p>
      </form>
    </div>
  );
}
