import { useState } from 'react';
import { PLACES } from '../journey/mock';
import { requiredError } from '../journey/validate';
import { TextField } from './controls';
import { LocateIcon, PinIcon, SearchIcon } from './icons';

type Place = (typeof PLACES)[number];

const LIMIT = 120;

/**
 * "Select your address" from the Figma: search (or use current location), pick a result, then add
 * house, street and landmark. Calls `onConfirm` with the full address.
 */
export function AddressPicker({ onConfirm, onCancel, cta = 'Confirm Address' }: { onConfirm: (address: string) => void; onCancel?: () => void; cta?: string }) {
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [house, setHouse] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [directions, setDirections] = useState('');
  const [tried, setTried] = useState(false);

  const q = query.trim().toLowerCase();
  const results = q.length >= 2 ? PLACES.filter((p) => `${p.name} ${p.area}`.toLowerCase().includes(q)) : [];

  const useLocation = () => {
    setLocating(true);
    // Stand-in for the device location: the first place on the list.
    setTimeout(() => {
      setLocating(false);
      setPlace(PLACES[0]!);
    }, 900);
  };

  if (!place) {
    return (
      <div className="addr">
        <TextField
          label="Search your address"
          value={query}
          onChange={setQuery}
          prefix={<SearchIcon />}
          placeholder="Building, area or pincode"
          autoComplete="off"
        />
        <button type="button" className="addr-locate" onClick={useLocation} disabled={locating}>
          <LocateIcon />
          {locating ? 'Finding your location…' : 'Use my current location'}
        </button>
        {results.length > 0 && (
          <ul className="addr-results" aria-label="Address suggestions">
            {results.map((p) => (
              <li key={p.name}>
                <button type="button" onClick={() => setPlace(p)}>
                  <PinIcon />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.area}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.length >= 2 && results.length === 0 && (
          <p className="addr-empty">
            <strong>No results found for this address!</strong> Try a building name, area or pincode, or use your current location.
          </p>
        )}
        {onCancel && (
          <button type="button" className="btn-link" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    );
  }

  const errors = {
    house: requiredError(house, 'your house / flat number'),
    street: requiredError(street, 'your street or locality'),
    landmark: requiredError(landmark, 'a landmark'),
  };
  const confirm = () => {
    setTried(true);
    if (errors.house || errors.street || errors.landmark) return;
    onConfirm(`${house.trim()}, ${street.trim()}, near ${landmark.trim()}, ${place.area}`);
  };
  const count = (v: string) => `${v.length}/${LIMIT}`;

  return (
    <div className="addr">
      <div className="addr-picked">
        <PinIcon />
        <span>
          <strong>{place.name}</strong>
          <small>{place.area}</small>
        </span>
        <button type="button" className="btn-link" onClick={() => setPlace(null)}>
          Change
        </button>
      </div>
      <TextField label="House No / Flat No / Floor / Tower" value={house} onChange={setHouse} maxLength={LIMIT} error={tried ? errors.house : null} hint={house ? count(house) : undefined} />
      <TextField label="Street / Locality / Area" value={street} onChange={setStreet} maxLength={LIMIT} error={tried ? errors.street : null} hint={street ? count(street) : undefined} />
      <TextField label="Landmark" value={landmark} onChange={setLandmark} maxLength={LIMIT} error={tried ? errors.landmark : null} />
      <TextField label="Directions to reach" optional value={directions} onChange={setDirections} maxLength={LIMIT} />
      <button type="button" className="btn btn-primary" onClick={confirm}>
        {cta}
      </button>
    </div>
  );
}
