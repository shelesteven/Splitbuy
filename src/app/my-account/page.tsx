"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthUserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/PageContainer";
import { toast } from "sonner";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface UserProfile {
  name: string;
  email: string;
  cardLast4?: string;
  cardBrand?: string;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: Address;
  residentialAddress?: Address;
  pickupAddress?: Address;
}

const getFieldFromContext = (context: any[], type: string) => {
  const item = context?.find((c) => c.id.startsWith(type));
  return item?.text || "";
};

const getCountryCode = (countryName: string): string => {
  const code = countries.getAlpha2Code(countryName, "en");
  return code || "CA";
};

export default function MyProfilePage() {
  const { authUser, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [resInput, setResInput] = useState("");
  const [pickupInput, setPickupInput] = useState("");
  const [resSuggestions, setResSuggestions] = useState<any[]>([]);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [resAddress, setResAddress] = useState<Address | null>(null);
  const [pickupAddress, setPickupAddress] = useState<Address | null>(null);
  const [sameAsRes, setSameAsRes] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.uid) return;
      const docRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        if (data.residentialAddress) {
          setResAddress(data.residentialAddress);
          setResInput(fullAddress(data.residentialAddress));
        }
        if (data.pickupAddress) {
          setPickupAddress(data.pickupAddress);
          setPickupInput(fullAddress(data.pickupAddress));
        }
      }
      setFetching(false);
    };
    fetchProfile();
  }, [authUser]);

  const fetchSuggestions = async (query: string, isRes: boolean) => {
    if (!query) return;
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&autocomplete=true&types=address&limit=5&country=ca,us`
    );
    const data = await res.json();
    isRes ? setResSuggestions(data.features) : setPickupSuggestions(data.features);
  };

  const handleSuggestionSelect = (sug: any, isRes: boolean) => {
    const context = sug.context || [];
    const countryName = getFieldFromContext(context, "country") || "Canada";
    const address: Address = {
      line1: sug.place_name?.split(",")[0] || "",
      line2: "",
      city: getFieldFromContext(context, "place"),
      state: getFieldFromContext(context, "region"),
      postal_code: getFieldFromContext(context, "postcode"),
      country: getCountryCode(countryName),
    };
    if (isRes) {
      setResInput(sug.place_name);
      setResAddress(address);
      setResSuggestions([]);
      if (sameAsRes) {
        setPickupInput(sug.place_name);
        setPickupAddress(address);
      }
    } else {
      setPickupInput(sug.place_name);
      setPickupAddress(address);
      setPickupSuggestions([]);
    }
  };

  const fullAddress = (addr: Address) =>
    `${addr.line1}, ${addr.city}, ${addr.state} ${addr.postal_code}, ${addr.country}`;

  const saveAddresses = async () => {
    if (!authUser?.uid) return;
    setSaving(true);
    await setDoc(
      doc(db, "users", authUser.uid),
      {
        residentialAddress: resAddress,
        pickupAddress: sameAsRes ? resAddress : pickupAddress,
      },
      { merge: true }
    );
    setSaving(false);
    toast.success("Addresses saved!");
  };

  if (loading || fetching) {
    return <p className="text-center mt-20">Loading profile...</p>;
  }

  return (
    <PageContainer className="flex flex-col items-center">
      <Card className="max-w-xl w-full p-8 mb-10">
        <h1 className="text-3xl font-bold text-center mb-6">My Profile</h1>
        <p className="mb-4 text-gray-600">Email: {profile?.email}</p>
        <p className="mb-6 text-gray-600">Name: {profile?.name}</p>

        {/* --- Address Management --- */}
        <div className="mb-4 relative">
          <label className="block font-medium mb-1">🏠 Residential Address</label>
          <input
            className="w-full p-2 border rounded"
            value={resInput}
            onChange={(e) => {
              setResInput(e.target.value);
              fetchSuggestions(e.target.value, true);
            }}
            placeholder="Start typing address..."
          />
          {resSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-white dark:bg-gray-800 border rounded mt-1 w-full max-h-48 overflow-y-auto">
              {resSuggestions.map((sug, i) => (
                <li
                  key={i}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSuggestionSelect(sug, true)}
                >
                  {sug.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={sameAsRes}
            onChange={() => setSameAsRes(!sameAsRes)}
            className="mr-2"
          />
          <label>Pickup address is same as residential</label>
        </div>

        {!sameAsRes && (
          <div className="mb-4 relative">
            <label className="block font-medium mb-1">🚚 Pickup Address</label>
            <input
              className="w-full p-2 border rounded"
              value={pickupInput}
              onChange={(e) => {
                setPickupInput(e.target.value);
                fetchSuggestions(e.target.value, false);
              }}
              placeholder="Start typing pickup address..."
            />
            {pickupSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white dark:bg-gray-800 border rounded mt-1 w-full max-h-48 overflow-y-auto">
                {pickupSuggestions.map((sug, i) => (
                  <li
                    key={i}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleSuggestionSelect(sug, false)}
                  >
                    {sug.place_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={saveAddresses}
          className="cursor-pointer w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
          disabled={!resAddress || (!sameAsRes && !pickupAddress) || saving}
        >
          {saving ? "Saving..." : "Save Addresses"}
        </button>
      </Card>

      {/* --- Credit Card Info --- */}
      <Card className="max-w-xl w-full p-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          💳 Credit Card
        </h2>

        {profile.cardLast4 && profile.cardBrand ? (
          <div className="bg-gray-50 p-4 rounded-lg border flex items-center gap-4">
            <div className="text-4xl">{getCardBrandEmoji(profile.cardBrand)}</div>
            <div>
              <p className="text-lg font-medium text-gray-800">
                {capitalize(profile.cardBrand)} •••• {profile.cardLast4}
              </p>
              {profile.billingName && (
                <p className="text-sm text-gray-600">Name: {profile.billingName}</p>
              )}
              {profile.billingEmail && (
                <p className="text-sm text-gray-600">Email: {profile.billingEmail}</p>
              )}
              {profile.billingAddress && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Address:</p>
                  <p>{profile.billingAddress.line1}</p>
                  {profile.billingAddress.line2 && <p>{profile.billingAddress.line2}</p>}
                  <p>
                    {profile.billingAddress.city}, {profile.billingAddress.state}{" "}
                    {profile.billingAddress.postal_code}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No card info available.</p>
            <a
              href="/credit-card"
              className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              Set up payment card
            </a>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

function getCardBrandEmoji(brand: string) {
  switch (brand.toLowerCase()) {
    case "visa":
    case "mastercard":
      return "💳";
    case "amex":
      return "💠";
    case "discover":
      return "🌐";
    default:
      return "💳";
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
