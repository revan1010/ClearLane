# Demo QR Codes

This folder contains QR code images for the toll booth demo.

## QR Code Format

Each QR code contains JSON data in this format:

```json
{
  "tollId": "TOLL_01",
  "name": "Mass Pike - Boston",
  "fee": 1.50,
  "roadId": "boston-nyc"
}
```

## Generating QR Codes

You can generate QR codes using any QR code generator with the following data:

### Boston → NYC Route (I-95)

1. `{"tollId":"TOLL_01","name":"Mass Pike - Boston","fee":1.50,"roadId":"boston-nyc"}`
2. `{"tollId":"TOLL_02","name":"Mass Pike - Worcester","fee":2.00,"roadId":"boston-nyc"}`
3. `{"tollId":"TOLL_03","name":"Mass Pike - Springfield","fee":1.75,"roadId":"boston-nyc"}`
4. `{"tollId":"TOLL_04","name":"CT Welcome","fee":2.50,"roadId":"boston-nyc"}`
5. `{"tollId":"TOLL_05","name":"Hartford Plaza","fee":2.00,"roadId":"boston-nyc"}`
6. `{"tollId":"TOLL_06","name":"New Haven Exit","fee":2.25,"roadId":"boston-nyc"}`
7. `{"tollId":"TOLL_07","name":"Bridgeport Plaza","fee":1.75,"roadId":"boston-nyc"}`
8. `{"tollId":"TOLL_08","name":"Stamford Gateway","fee":2.50,"roadId":"boston-nyc"}`
9. `{"tollId":"TOLL_09","name":"Greenwich Border","fee":3.00,"roadId":"boston-nyc"}`
10. `{"tollId":"TOLL_10","name":"Bronx Entry","fee":3.50,"roadId":"boston-nyc"}`
11. `{"tollId":"TOLL_11","name":"Triborough Bridge","fee":4.00,"roadId":"boston-nyc"}`
12. `{"tollId":"TOLL_12","name":"Manhattan Exit","fee":1.75,"roadId":"boston-nyc"}`

## For Demo

Print these QR codes and display them on a board. During the demo, scan each code rapidly to show instant toll payments.
