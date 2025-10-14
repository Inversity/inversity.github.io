---
layout: default
---
## **Potential Impact Level: HIGH**

_**When a Tip is added to an order**_, Customers shown different totals across **all** platforms ($18.05 Web Order Checkout, $18.14 Web Order Email Receipt, $18.15 iOS, $18.15 Android) but Firebase records _**incorrect**_ amount of $18.14 - **Correct** actual Total is $18.05. Fee calculations displayed and recorded into Firebase with varying amounts depending on platform. Affects ALL orders in Dev and Production.

**KEY FINDINGS:**

1. _**Bug ONLY occurs when tip is present**_ - Orders without tips calculate correctly
2. **Three different totals shown** for same order across platforms
3. **Web Orders completely ignore tax** even when enabled (separate bug uncovered - Trello Card incoming)
4. **Android overcharge nearly doubles** with tax enabled ($0.10 → $0.17)

**Note:** Lots of differing values between platforms, displayed values, and Firebase entries. I've triple checked everything, but there may be mistakes. Check the formulas for errors (some were unknown to me - even if formula errors exist, all of the bug findings remain the same).

## **Summary**

Fee and Total calculations are inconsistent across all platforms when a _**Tip is present**_. **Example:**

- $15 item, 0% tax (not enabled), 5% tip of $0.75, 10%/2.9%/$0.30 Starter Fee structure.
- Has the following behavior
  - Web Order checkout correctly shows $18.05 for total
  - Web Order Email Receipt incorrectly shows $18.14
  - iOS/Android app incorrectly shows $18.15, _but Firebase/backend records $18.14 for all_
  - Three different totals displayed for the same order configuration
  - Email receipts use the incorrect Firebase totals
  - Android App submits different `serviceFees` to Firebase compared to Web Orders/iOS (Android records $1.57, Web Order/iOS records $1.58)
    - This has no effect on recorded `totalFees` (Records incorrect value of $2.40 for all venues)
  - Kitchen App displays the incorrect Firebase total of $18.14 for all orders
  - _Smaller note_: Inconsistent Fee breakdown and Fee naming structure display across all platforms

## **Test Scenario**

**IMPORTANT:** To verify this bug, test WITH a tip. Orders without tips calculate correctly across all platforms.

**Test Configuration:**

- **Venue:** `Debug Deli` (Dev Environment), `Joe's Jambalaya` (Prod Environment)
- **Default Tax:** 10% rate (Two sets of tests between enabled/disabled)
- **Item Price:** $15
- **Tip Percentage:** 5%
- **Tip Amount:** $0.75
- **BlazeBite Service Fee:** 10%
- **Payment Processing:** 2.9%
- **Payment Processing Flat Fee per Order:** $0.30
- **Firebase Order Document's** `orderID` values:
  - **Tax Disabled:**
    - **Web Order:** [63](https://console.firebase.google.com/u/0/project/blazebite-dev/firestore/databases/-default-/data/~2Fvenues~2F4zhM44zmGlk8ZR2vhTPE~2Forders~2FfMpuBn2Jaq2LpcLIjmnD "‌")
    - **iOS:** [64](https://console.firebase.google.com/u/0/project/blazebite-dev/firestore/databases/-default-/data/~2Fvenues~2F4zhM44zmGlk8ZR2vhTPE~2Forders~2FKP2Xfj0BTH1UdEmjVycn "‌")
    - **Android:** [65](https://console.firebase.google.com/u/0/project/blazebite-dev/firestore/databases/-default-/data/~2Fvenues~2F4zhM44zmGlk8ZR2vhTPE~2Forders~2FnXgXU6ty5T7UacodTyED "‌")
  - **Tax Enabled at 10%:**
    - **Web Order:** [70](https://console.firebase.google.com/u/0/project/blazebite-dev/firestore/databases/-default-/data/~2Fvenues~2F4zhM44zmGlk8ZR2vhTPE~2Forders~2F61yLv8sPjoOKFP0eWUDJ "‌")
    - **iOS:** [69](https://console.firebase.google.com/u/0/project/blazebite-dev/firestore/databases/-default-/data/~2Fvenues~2F4zhM44zmGlk8ZR2vhTPE~2Forders~2FNrES3MOcFu9drEDuHG2X "‌")
    - **Android:** [71](https://console.firebase.google.com/u/0/project/blazebite-dev/firestore/databases/-default-/data/~2Fvenues~2F4zhM44zmGlk8ZR2vhTPE~2Forders~2FyAuiI3QXaVbzV52dneHN "‌")

**Steps to Reproduce (WITHOUT TAX):**

1. Create order with $15.00 item ("The Overflow Sub" in Dev/"$15 item" in Prod)
2. Add 5% tip ($0.75)
3. Proceed to checkout
   1. **Web Order**: Shows $18.05 total, $1.5 Service Fee, $0.80 Processing Fee
   2. **iOS**: Shows $18.15 total, $2.41 combined fees
   3. **Android:** Shows $18.15 total, $2.40 combined Fee
4. Complete order on any platform
5. Check Firebase - Shows $18.14 total (regardless of platform)
6. (For Web Orders) Check email receipt - Shows total $18.14, $2.41 combined fees

**Steps to Reproduce (WITH 10% TAX):**

1. Enable 10% tax in venue settings or set manual tax on Menu Item
2. Create order with $15.00 item
3. Add 5% tip (calculates on post-tax amount)
4. Proceed to checkout
   1. **Web Order**: Still shows $18.05 (IGNORES TAX COMPLETELY)
   2. **iOS**: Shows $19.94 total, $2.61 combined fees
   3. **Android:** Shows $20.02 total, $2.62 combined fees
5. Complete order on any platform
6. Check Firebase - Records different values per platform

## Bug behavior WITHOUT Tax (0% Tax)

### Expected Correct Calculation without Tax

```
Item:              $15.00
Tax (0%):          $ 0.00
Subtotal:          $15.00
Tip (5%):          $ 0.75 (5% of $15.00)
'netAmount':       $15.75 (Tip+Tax+Item)
Service Fee (10%): $ 1.50 (10% of $15.00)
Processing Fee:    $ 0.80 (2.9% of $17.25 + $0.30)
-----------------------
CORRECT TOTAL:     $18.05
```

### **Observed Data and Behavior without Tax**

**Correct Calculations (all platforms agree):**

- **Item**: $15.00
- **Tax**: $0.00
- **Tip**: $0.75

**Web Order Checkout Screen:**

- **Total**: $18.05 (correct)
- **Service Fee**: $1.50 (correct 10% of $15.00)
- **Processing Fee**: $0.80 (correct 2.9% of $17.25 + $0.30)
- Individual fee breakdowns not shown
- All calculations match expected mathematical values
- Individual fee breakdowns shown
- Note: Uses "Service Fees" label vs "Convenience Fee(s)" in iOS/(Android)

**Web Order Email Receipt:**

- **Total**: $18.14 (incorrect - pulls incorrect Firebase total)
- **Service Fees (combined)**: $2.41 (incorrect - combines all fees but sum is wrong)
- Individual fee breakdowns not shown

**Web Order Firebase/Super Admin Portal records** (assuming `netAmount` = `tax`+`tip`+`orderSubtotal)`:

- `netAmount`: $15.74 (incorrect - **$-0.01**)
- `orderTotal`: $18.14 (incorrect - +$0.09)
- `serviceFees`: $1.58 (incorrect - +$0.08)
- `paymentFees`: $0.83 (incorrect - +$0.03)
- `totalFees`: $2.40 (incorrect - +$0.10)

**iOS Checkout Screen:**

- **Total**: $18.15 (incorrect - +$0.10 vs correct amount)
- **Convenience Fees (combined):** $2.41 (incorrect - +$0.11 vs correct amount)
- **Firebase/Super Admin Portal records** (assuming `netAmount` = `tax`+`tip`+`orderSubtotal)`:
  - `netAmount`: $15.74 (incorrect - **$-0.01**)
  - `orderTotal`: $18.14 (incorrect - +$0.09)
  - `serviceFees`: $1.58 (incorrect - +$0.08)
  - `paymentFees`: $0.83 (incorrect - +$0.03)
  - `totalFees`:   $2.40 (incorrect - +$0.10)
- Individual fee breakdowns not shown
- **Note**: Uses "Convenience Fees" label vs "Service Fees" in email receipt

**Android Checkout Screen:**

- **Total**: $18.15 (incorrect - +$0.10 vs correct amount)
- **Convenience Fee (combined):** $2.40 (incorrect - +$0.10 vs correct amount) - Note: $0.01 difference in Firebase vs Web Order/iOS
- **Firebase/Super Admin Portal records** (same `netAmount` assumption from iOS):
  - `netAmount`: $15.74 (incorrect - **-0.01**)
  - `orderTotal`: $18.14 (incorrect - +$0.09)
  - `serviceFees`: $1.57 Android (incorrect - +$0.07)
  - `paymentFees`: $0.83 (incorrect - +$0.03, same as `grossUpPaymentFees`)
  - `totalFees`:  $2.40 (incorrect - +$0.10)
- Individual fee breakdowns not shown
- **Note**: Uses "Convenience Fee" (not plural) label vs the pluralized "Convenience Fees" in iOS and "Service Fees" in email receipt

**Platform-Specific Total Calculation Discrepancies:**

- **Correct Total:** $18.05
  - **Web Order** shows: $18.05 (correct)
  - **Email** shows: $18.14 (incorrect - +$0.09)
  - **iOS/Android** shows: $18.15 (incorrect - +$0.10)
  - **Firebase/Super Admin Portal** records: $18.14 (incorrect - +$0.09)

### **Percentage Analysis Tax**

**Overall Overcharge:**

- **Web Order Email Receipt** displays: $18.14 - 0.50% overcharge ($0.09/$18.05)
- **Web Order Email Receipt/iOS/Android Checkout Screen** displays: $18.15 - 0.55% overcharge ($0.09/$18.05)
- **Firebase/Super Admin Portal** records for _all_: $18.14 - 0.50% overcharge ($0.09/$18.05)

**Service Fee Miscalculation:**

- **Actual Expected**: $1.50 (10.0% of $15.00)
- **Observed:**
  - **Web Order Email Receipt** displays $1.58 (10.533% of $15.00, 5.33% increase)
  - **Firebase iOS** record $1.58 (10.533% of $15.00, 5.33% increase)
  - **Firebase Android** record $1.57 (10.466% of $15.00, 4.66% increase)
  - **Web Order Checkout Screen** displays the correct amount

**Processing Fee Miscalculation:**

- **Actual Expected**: $0.80
- **Observed**: \_All \_records $0.83 (1.0375% of $0.80, 3.75% increase)

## **Bug behavior WITH Tax Enabled (10% Tax)**

### **Expected Correct Calculation with 10% Tax:**

```
Item:              $15.00
Tax (10%):         $ 1.50
Subtotal:          $16.50
Tip (5%):          $ 0.82 (5% of $16.50)
`netAmount`:       $17.32 (Tip+Tax+Item)
Service Fee (10%): $ 1.65 (10% of $16.50)
Processing Fee:    $ 0.88 (2.9% of $18.97 + $0.30)
-----------------------
CORRECT TOTAL:     $19.85
```

### **Observed Data and Behavior with 10% Tax (% or $ has no effect on outcome)**

**Correct Calculations (all platforms agree):**

- Item: $15.00
- Tax: $1.50
- Tip: $0.75

**Web Order (combined due to additional bug):**

- **Total**: $18.05 (no tax calculated or displayed)
- **Tax**: $0.00 (should be $1.50)
- **Firebase/Super Admin Portal** records: $0.00 tax
- **Everything identical to non-tax Web Orders**

**iOS App with Tax:**

- **Total**: $19.94 (incorrect - +$0.09, matches Firebase)
- **Tax**: $1.50 (correct - matches Firebase)
- **Tip**: $0.82 (correct - matches Firebase)
- **Convenience Fees (combined):** $2.61 (incorrect - +$0.08, matches incorrect Firebase value)
- **Firebase/Super Admin Portal** records (assuming `netAmount` = `tax`+`tip`+`orderSubtotal)`:
  - `netAmount`: $17.33 (incorrect - +$0.01)
  - `orderTotal`: $19.94 (incorrect - +$0.09)
  - `serviceFees`: $1.73 (incorrect - +$0.08)
  - `paymentFees`: $0.88 (correct)
  - `totalFees`:   $2.61 (incorrect - +$0.08)

**Android App with Tax:**

- **Total**: $20.02 (incorrect - +$0.17, matches Firebase)
- **Tax**: $1.50 (correct - matches Firebase)
- **Tip**: $0.90 (incorrect - +$0.08, matches Firebase)
- **Convenience Fee (combined)**: $2.62 (incorrect - +$0.08, matches incorrect Firebase value)
- **Firebase/Super Admin Portal**:
  - `netAmount`: $17.40 (incorrect - +$0.08)
  - `orderTotal`: $20.02 (incorrect +$0.17)
  - `serviceFees`: $1.74 (incorrect - +$0.09)
  - `paymentFees`: $0.88 (correct)
  - `totalFees`:   $2.62 (incorrect - +$0.09)

**Platform-Specific Total Calculation Discrepancies:**

- **Correct Total**: $19.85
  - **Web Order** Shows:\*\* $18.05 (incorrect - using actual correct _non-tax_ total) **NEW separate bug causing tax to be ignored completely, see below**)
  - **Email** shows: $18.14 (incorrect - using incorrect _non-tax_ total from Firebase) **Same new bug causing tax ignorance**
  - **iOS** shows and records into Firebase: $19.94 (incorrect - +$0.09)
  - **Android** shows and records into Firebase:* $20.02 (incorrect - +$0.17)

### **Percentage Analysis Tax**

**Overall Overcharge:**

- **Web Order Checkout Screen/Web Order Email Receipt Firebase/Super Admin Portal** records and display: Same as non-tax order respectively
- **Android Checkout Firebase/Super Admin Portal** records and display: $20.02 - 0.86% overcharge ($0.17/$19.85) - _Nearly double_
- **iOS Checkout Firebase/Super Admin Portal** record and display: $19.94 - 0.45% overcharge ($0.09/$19.85)

**Service Fee Miscalculation:**

- _Same values and entries non-tax orders_

**Processing Fee Miscalculation:**

- _Same values and entries non-tax orders_

**Additional semi-unrelated bug found during testing:** Web Orders completely ignore tax settings - even with 10% tax enabled (using either Venue Default Tax % or setting the Tax % manually on the item itself), Web Order checkout doesn't display or charge tax, and Firebase records $0 tax for Web Orders.

# **Implication**

**When a tip is added to the Order**, Customers see different checkout totals and fees depending on platform, and neither Web Order Email Receipt/iOS/Android nor Firebase matches the correct calculations.

## **Additional Thoughts & Notes**

- **IMPORTANT:** Only occurs when `Tip` is added to the order - orders without tips calculate correctly
- **IMPORTANT:** Web Orders cannot process tax even when enabled - completely separate bug report will follow
- Bug exists in both Dev and Production environments
- Affects all orders (Web Orders, iOS App, Android App)
- Need confirmation of `netAmount` calculation - Assumed to be `Tax`+`Tip`+`orderSubtotal` based on context and testing
- The `grossUpPaymentFees` field suggests recursive fee calculation causing inflation
- Service fee calculating as ~10.533%/10.466% instead of 10.00% (no tax), ~10.48% with tax
- Three different systems showing three different totals for identical orders
- Android overcharge nearly doubles when tax is enabled ($0.10 -> $0.17)
- Consistent reproduction across multiple test orders on both platforms
- Terminology inconsistency: "Service Fees" (email) vs "Convenience Fees" (iOS) vs "Convenience Fee" (Android)

## Screenshots

### With Tax Disabled:

- **Web Order Checkout Screen:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee79df25dfa0fbb2baef45/download/image.png)
- **Web Order Email Receipt:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee79e52fed17ca9a5feb7b/download/image.png)
- **iOS App:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee79fe9ca59c0068f1c0f7/download/image.png)
- **Android App:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a086d01c18cb3f4796b/download/image.png)
- **Firebase Web Order/iOS Order Details:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a14b26b8c0637ed7750/download/image.png)
- **Firebase Android Customer Order Details:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a1f6defc8aecd625335/download/image.png)

### With Tax enabled at 10%:

- **Web Order Checkout Screen:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a384e8a6a4a79405679/download/image.png)
- **Web Order Email Receipt:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a3e103851f2e7a26015/download/image.png)
- **iOS App:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a48cdb5f79b27bd0964/download/image.png)
- **Android App:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a5006f251e284fcbbf5/download/image.png)
- **Firebase Web Order Details:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a7a8d421fdbc3e7a367/download/image.png)
- **Firebase iOS Order Details:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a87eae459e2d80c69cd/download/image.png)
- **Firebase Android Customer Order Details:**
  ![image.png](https://trello.com/1/cards/68ee73ab23d23e76356e569f/attachments/68ee7a827b2c3707907f3df2/download/image.png)
