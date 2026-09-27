COPY public.bookings (
  reference, status, payment_status, direction, airport_id, destination_address, 
  destination_lat, destination_lng, vehicle_id, pickup_date, pickup_time, 
  flight_number, passengers, bags, customer_name, email, phone, notes, fare, 
  distance_miles, stripe_checkout_session_id, stripe_payment_intent_id, paid_at, 
  created_at, pickup_address, pickup_lat, pickup_lng, dropoff_address, 
  dropoff_lat, dropoff_lng, add_ons, add_ons_total, promo_code, discount_amount, 
  outbound_trip_reference, return_trip_reference, payment_method, stops, 
  stops_total, review_requested_at, source_place_id, source_place_slug, 
  customer_id, referrer_customer_id    
)
FROM STDIN 
WITH (
  FORMAT csv, 
  HEADER true, 
  DELIMITER ',', 
  NULL 'null' -- < This tells Postgres that the word "null" means an empty database value!
);

-- PASTE YOUR CSV ROWS DIRECTLY BELOW THIS LINE (Keep the header row included!)
reference,status,payment_status,direction,airport_id,destination_address,destination_lat,destination_lng,vehicle_id,pickup_date,pickup_time,flight_number,passengers,bags,customer_name,email,phone,notes,fare,distance_miles,stripe_checkout_session_id,stripe_payment_intent_id,paid_at,created_at,pickup_address,pickup_lat,pickup_lng,dropoff_address,dropoff_lat,dropoff_lng,add_ons,add_ons_total,promo_code,discount_amount,outbound_trip_reference,return_trip_reference,payment_method,stops,stops_total,review_requested_at,source_place_id,source_place_slug,customer_id,referrer_customer_id
AT-XVJAJCWEQJHE,confirmed,unpaid,custom,custom,"Windsor Castle, Windsor SL4 1NJ, UK",51.483894,-0.6044027,standard,2026-08-31,02:00:00,BA2323,1,1,Siddique Baigh,faizanbaigh512@gmail.com,+447232323,read carefully,65.00,8.70,null,null,null,2026-08-30 23:20:10.643+00,"Heathrow Airport, Hounslow, UK",51.4679903,-0.4550471,"Windsor Castle, Windsor SL4 1NJ, UK",51.483894,-0.6044027,"[{""id"":""meet-greet"",""name"":""Meet & greet"",""price"":15}]",15.00,null,0.00,null,null,cash,[],0.00,null,null,null,null,null
-- (If you have more rows, paste them all here)
\.
