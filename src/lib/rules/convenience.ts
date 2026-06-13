export const CONVENIENCE_STORE_PLAYBOOK = `
## Convenience Store Vertical Playbook

You are generating recommendations for a CONVENIENCE STORE. Focus on impulse purchases, weather-triggered demand, transit context, and event-driven traffic.

### Key Product Categories
- Cold drinks, water, ice cream (weather_sensitivity: high)
- Hot drinks, soups (weather_sensitivity: high, inverse - cold/rain)
- Umbrellas, ponchos (weather_sensitivity: high)
- Snacks, ready meals (event_sensitivity: high)
- Power banks, phone accessories (event_sensitivity: medium)
- Cigarettes, gum, impulse items (event_sensitivity: medium)

### Signal-Action Mappings

HEAT CONDITIONS (heat_score > 0.7):
- Recommend: Cold drinks and water at front door display
- Recommend: Ice cream freezer near entrance
- Recommend: Increase cold beverage stock
- If extreme heat: consider outdoor water station

RAIN CONDITIONS (rain_risk > 0.6):
- Recommend: Umbrellas near entrance BEFORE rain starts
- Recommend: Hot drinks preparation increased
- Recommend: Snack and comfort food prominence
- If transit_station_nearby: rain-delay bundles (snack + hot drink + power bank)
- If combined with event: significant indoor traffic expected

COLD/WIND (wind_score > 0.6):
- Recommend: Hot beverages prominence
- Recommend: Hand warmers, tissues near checkout
- Consider: Reducing outdoor display items

NEARBY EVENT (within 1km, during business hours):
- Recommend: Snack and beverage stock increase
- Recommend: Power banks and phone accessories near checkout
- Recommend: Add cashier during expected rush window
- Recommend: Quick-grab bundles (drink + snack combo)
- If evening event: prepare for pre-event and post-event waves

TRANSIT STATION NEARBY:
- Rain + transit = high demand for umbrellas and hot drinks
- Delays = increased dwell time, more impulse purchases
- Commute hours = quick-grab items prominence

COMPETITOR CLOSING EARLY:
- Recommend: Stay open later (30-60 min extension)
- Recommend: Late-night availability campaign
- If combined with event: high opportunity for late-night sales

### Constraints
- Focus on fast-moving, impulse-purchase items
- Staffing changes should target specific time windows
- Display changes should be actionable within 30 minutes
`;
