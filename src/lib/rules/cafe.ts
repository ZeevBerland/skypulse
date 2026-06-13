export const CAFE_PLAYBOOK = `
## Cafe / Quick-Service Restaurant Vertical Playbook

You are generating recommendations for a CAFE or QSR. Focus on menu mix, staffing, outdoor seating decisions, delivery promotion, and event-driven traffic.

### Key Product Categories
- Iced drinks, cold brew, smoothies (weather_sensitivity: high)
- Hot drinks, specialty coffee, tea (weather_sensitivity: high, inverse)
- Cold food: salads, sandwiches, bowls (weather_sensitivity: medium)
- Hot food: soups, pastries, warm meals (weather_sensitivity: medium, inverse)
- Takeaway/delivery items (weather_sensitivity: medium)

### Signal-Action Mappings

HEAT CONDITIONS (heat_score > 0.7):
- Recommend: Increase iced drink preparation (cold brew, iced latte, smoothies)
- Recommend: Cold menu items prominence
- Recommend: Outdoor water station if outdoor seating available
- Consider: Summer special promotion via social media
- If combined with event: prepare extra iced drink supplies

RAIN CONDITIONS (rain_risk > 0.6):
- Recommend: Reduce or secure outdoor seating
- Recommend: Promote indoor seating capacity
- Recommend: Launch delivery promotion campaign
- Recommend: Increase hot drink and comfort food prep
- If rain + wind: close outdoor area entirely, shift all staff indoors

WIND CONDITIONS (wind_score > 0.6):
- Recommend: Secure outdoor signage and displays
- Recommend: Reduce outdoor seating if wind_score > 0.8
- Recommend: Shift campaign from outdoor seating to takeaway
- If combined with rain: priority becomes high

PLEASANT WEATHER (heat_score 0.3-0.6, rain_risk < 0.3, wind_score < 0.4):
- Recommend: Maximize outdoor seating
- Recommend: Outdoor specials and signage
- This is the highest-opportunity weather pattern for cafes

NEARBY EVENT (within 1km, during business hours):
- Recommend: Add staff for post-event rush window
- Recommend: Quick-service menu items prepared in advance
- Recommend: Social media post targeting event attendees
- If event ends near closing: consider staying open later

COMPETITOR CLOSING EARLY:
- Recommend: Promote late-hours availability
- Recommend: Target post-event or evening crowd
- If combined with pleasant weather: outdoor seating late opportunity

AIR QUALITY ISSUES (air_quality_score > 0.6):
- Recommend: Close outdoor seating area
- Recommend: Promote indoor seating and delivery
- Recommend: Consider air quality note on social media

### Constraints
- Outdoor seating decisions are the most impactful for cafes
- Menu mix changes need lead time (at least 2 hours for prep)
- Staffing changes should be planned for specific time blocks
- Delivery promotions need ~30 min lead time for platform updates
`;
