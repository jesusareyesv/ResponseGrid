import { Location, InvalidLocationError } from './location';

describe('Location value object (resources)', () => {
  it('creates a valid location', () => {
    const loc = Location.create({ address: 'Valencia, España', latitude: 39.4699, longitude: -0.3763 });
    expect(loc.address).toBe('Valencia, España');
    expect(loc.latitude).toBe(39.4699);
    expect(loc.longitude).toBe(-0.3763);
  });

  it('trims whitespace from address', () => {
    const loc = Location.create({ address: '  Calle Mayor 1  ', latitude: 0, longitude: 0 });
    expect(loc.address).toBe('Calle Mayor 1');
  });

  it('accepts boundary latitude -90', () => {
    expect(() => Location.create({ address: 'South Pole', latitude: -90, longitude: 0 })).not.toThrow();
  });

  it('accepts boundary latitude 90', () => {
    expect(() => Location.create({ address: 'North Pole', latitude: 90, longitude: 0 })).not.toThrow();
  });

  it('accepts boundary longitude -180', () => {
    expect(() => Location.create({ address: 'Date Line', latitude: 0, longitude: -180 })).not.toThrow();
  });

  it('accepts boundary longitude 180', () => {
    expect(() => Location.create({ address: 'Date Line', latitude: 0, longitude: 180 })).not.toThrow();
  });

  it('throws InvalidLocationError for latitude > 90', () => {
    expect(() => Location.create({ address: 'Nowhere', latitude: 91, longitude: 0 })).toThrow(InvalidLocationError);
  });

  it('throws InvalidLocationError for latitude < -90', () => {
    expect(() => Location.create({ address: 'Nowhere', latitude: -91, longitude: 0 })).toThrow(InvalidLocationError);
  });

  it('throws InvalidLocationError for longitude > 180', () => {
    expect(() => Location.create({ address: 'Nowhere', latitude: 0, longitude: 181 })).toThrow(InvalidLocationError);
  });

  it('throws InvalidLocationError for longitude < -180', () => {
    expect(() => Location.create({ address: 'Nowhere', latitude: 0, longitude: -181 })).toThrow(InvalidLocationError);
  });

  it('throws InvalidLocationError for empty address', () => {
    expect(() => Location.create({ address: '', latitude: 0, longitude: 0 })).toThrow(InvalidLocationError);
  });

  it('throws InvalidLocationError for whitespace-only address', () => {
    expect(() => Location.create({ address: '   ', latitude: 0, longitude: 0 })).toThrow(InvalidLocationError);
  });

  it('toPlain() returns plain object', () => {
    const props = { address: 'Madrid, España', latitude: 40.4168, longitude: -3.7038 };
    const loc = Location.create(props);
    expect(loc.toPlain()).toEqual(props);
  });
});
