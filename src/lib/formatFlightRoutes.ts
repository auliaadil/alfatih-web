import { FlightRoute, Airport } from '../../types';

export function formatFlightRoutes(
  routes: FlightRoute[] | undefined,
  airlineNames: Record<string, string>,
  airports: Airport[]
): string {
  if (!routes || routes.length === 0) return 'Flight details TBA';

  const airportMap = Object.fromEntries(airports.map((a) => [a.id, a.iata_code]));

  return routes
    .map((route) => {
      const airline = airlineNames[route.airline_id] || 'Unknown Airline';
      const legStr = route.legs
        .map((leg) => `${airportMap[leg.from_airport_id] ?? '?'} → ${airportMap[leg.to_airport_id] ?? '?'}`)
        .join(', ');
      return legStr ? `${airline}: ${legStr}` : airline;
    })
    .join(' | ');
}
