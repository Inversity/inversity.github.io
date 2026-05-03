---
layout: misc
title: Kitchen App 2.0 | QA Test Plan Notes
description: Notes
category: blazebite
date: 01/05/2026
permalink: /2-0-test-suite/
tags: [BlazeBite, Kitchen, Kiosk, App, POS, Point of Sale, Test Plan, QA, Quality Assurance]
---

---

**Tester:** Joe  
**Device:** SILK Terminal/Android Tablet  
**Date:** 04/20/2026 - 05/01/2026  

## Table of Contents {#toc}

---

1. [Launch & Authentication](#launch-auth)
2. [App Header & Navigation Bar](#app-header-nav-bar)
3. [Live Orders (Kitchen Board)](#live-orders)
4. [Order History](#order-history)
5. [POS & Cash Flows](#pos-cash-flows)
6. [Settings](#settings)
7. [Reports](#reports)
8. [Menus](#menus)
9. [Hardware Integration](#hardware-integration)
10. [Kiosk](#kiosk)
11. [Connectivity & Resilience](#connectivity-resilience)
12. [List of Bugs Found](#notable-findings)  
    - [List of Failed Tests](#failed-tests)  
    - [List of Semi-Passed/Failed Tests](#semi-passed-semi-failed-tests)  

## 1. Launch & Authentication {#launch-auth}

---

**App Launch:**

1. Pass ✔️  
2. Pass ✔️  
3. Pass ✔️  

**Sign-in:**  

4. Pass ✔️  
5. <a id="fail-5"></a>**Fail** ❌: Entering invalid credentials does not display _any_ error. Instead it disables the `Login` button.  
6. <a id="semi-6"></a>_Semi-Pass_ ⚠️: Nothing happens - no error, no crash/freeze.  
7. Pass ✔️  

**Sign-out:**  

8. Pass ✔️  
9. <a id="fail-9"></a>**Fail** ❌: Pressing back _does_ take you back into the Venue. The entire Venue is accessible and active.  

**Additional Notes:**

- [Test 9](#fail-9). was mentioned to you in our conversation in Slack previously.  

<sub>[Return to Top](#toc)</sub>

## 2. App Header & Navigation Bar {#app-header-nav-bar}

---

**Venue Status Indicator:**  

10. Pass ✔️  
11. Pass ✔️  
12. Pass ✔️
13. Pass ✔️
14. Pass ✔️
15. Pass ✔️

**Header Controls:**

16. Pass ✔️
17. Pass ✔️
18. Pass ✔️
19. Pass ✔️
20. Pass ✔️
21. Pass ✔️
22. Pass ✔️
23. Pass ✔️
24. Pass ✔️
25. Pass ✔️
26. Pass ✔️
27. <a id="fail-27"></a>**Fail** ❌: On my Samsung Tablet (Galaxy A7 Lite), the buttons push off the right side of the screen. I cannot see/access the "Settings" button due to this.

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 3. Live Orders (Kitchen Board) {#live-orders}

---

**Now Making Panel:**

28. **Cannot Test**
29. **Cannot Test**
30. **Cannot Test**
31. **Cannot Test**

**Order Card Display:**

32. <a id="semi-32"></a>_Semi-Pass_ ⚠️:
    - Displays all info except it shows the `Pickup Location` for orders placed via App or Web, and `Cash Register` for orders placed via POS, `Kiosk` for orders via Kiosk.  
    - Does not show order total
33. **Cannot Test**
34. **Cannot Test**.
35. **Cannot Test**
36. **Cannot Test**
37. **Cannot Test**
38. **Cannot Test**

**Filter - Items Older Than 15. Minutes:**

39. **Cannot Test**
40. **Cannot Test**
41. **Cannot Test**

**Bulk Actions:**

42. **Cannot Test**
43. **Cannot Test**
44. **Cannot Test**
45. **Cannot Test**
46. **Cannot Test**
47. **Cannot Test**
48. **Cannot Test**
49. **Cannot Test**
50. **Cannot Test**

**Individual Order Actions:**

51. **Cannot Test**
52. **Cannot Test**
53. **Cannot Test**
54. **Cannot Test**

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 4. Order History {#order-history}

---

**History List:**

55. Pass ✔️
56. Pass ✔️
57. <a id="semi-57"></a>_Semi-Fail_ ⚠️: The search bar is displayed, but it does not accurately search. As far as I can tell, _only_ the `Order Number` is searchable. Everything else does nothing.
58. Pass ✔️
59. Pass ✔️

**Order Row (Header):**

60. Pass ✔️
61. Pass ✔️
62. Pass ✔️
63. Pass ✔️

**Order Detail Panel:**

64. Pass ✔️: Expands the detail panel
65. Pass ✔️
66. Pass ✔️
67. <a id="semi-67"></a>_Semi-Pass_ ⚠️: The `Customer Notified` row is present, but it is lacking a timestamp.
68. <a id="semi-68"></a>_Semi-Pass_ ⚠️: Button is displayed, but only venue-level fields are shown when tapped
69. <a id="semi-69"></a>_Semi-Pass_ ⚠️: Button is displayed, but only venue-level fields are shown when tapped
70. Pass ✔️: (Need re-test when fix is implemented)

**Refund - Card Payment:**

71. Pass ✔️
72. Pass ✔️
73. Pass ✔️
74. Pass ✔️
75. Pass ✔️
76. Pass ✔️
77. Pass ✔️
78. Pass ✔️
79. Pass ✔️
80. Need Additional Testing - Firebase?
81. Need Additional Testing - Firebase?
82. Pass ✔️
83. Pass ✔️
84. Pass ✔️
85. Pass ✔️
86. Pass ✔️: Tested using an incredibly small, but long decimal ($.00000000000000000000000000000000001)

**Refund - Cash Payment:**

87. Pass ✔️
88. Pass ✔️
89. <a id="fail-89"></a>**Fail** ❌: `REFUNDED` does not appear in any row or color. Doing a Full Refund just marks it to `$0.00`

**Notify Customer:**

90. Pass ✔️
91. Pass ✔️
92. Pass ✔️
93. Pass ✔️

**Print / Reprint:**

94. Pass ✔️
95. Pass ✔️
96. Pass ✔️
97. Pass ✔️

**Additional Notes:**  

- _Print / Reprint_: Potential bug I mentioned to you via Slack on 04/29/26. Having some seemingly unrelated, buggy behavior regarding printing and I _think_ the app/device sleeping or spending a long time without doing anything (>20 minutes). Will test more and keep posted.

<sub>[Return to Top](#toc)</sub>

## 5. POS & Cash Flows {#pos-cash-flows}

---

**POS Mode - Navigation & Layout:**

98. Pass ✔️
99. Pass ✔️
100. Pass ✔️
101. <a id="fail-101"></a>**Fail** ❌: This is actually the opposite - the tablet I have completely fails to output the POS correctly. Everything is smushed together. This was the same on the previous versions of Kitchen App POS as well (<2.0)

**POS - Building an Order:**

102. Pass ✔️
103. Pass ✔️
104. Pass ✔️
105. Pass ✔️
106. <a id="fail-106"></a>**Fail** ❌: I do not see a `order-items` button. I cannot see a way to view `Item Customizations`, Item `Customer Customizations`, or `Venue Customizations`.
107. <a id="fail-107"></a>**Fail** ❌: See above.

**POS - Credit Card Payment Flow:**

108. Pass ✔️
109. Pass ✔️
110. Pass ✔️
111. Pass ✔️
112. Pass ✔️
113. Pass ✔️
114. <a id="fail-114"></a>**Fail** ❌: _**Confirmed App Crash.**_ Begin CC Stripe Payment process. When customer enters card, tap "Cancel". This then causes app to stop working and crash to desktop.

**POS - Cash Payment Flow:**

115. Pass ✔️
116. Pass ✔️
117. Pass ✔️
118. Pass ✔️
119. Pass ✔️
120. Pass ✔️

**End of Day / Session Totals:**

121. <a id="fail-121"></a>**Fail** ❌: `End of Day` not available in either `Reports` or `POS` screens
122. ?
123. Pass ✔️

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 6. Settings {#settings}

---

**Layout & Navigation:**

124. Pass ✔️
125. Pass ✔️
126. Pass ✔️: Looks good once it's open on the Tablet

**Printer:**

127. Pass ✔️
128. Pass ✔
129. Pass ✔️
130. Pass ✔️
131. Pass ✔️
132. <a id="semi-132"></a>_Semi-Pass_ ⚠️: Unsure - The `Connected`/`Disconnected` button does nothing. The only way to connect/reconnect is by tapping `Scan for Printers`
133. Pass ✔️
134. Pass ✔️: _NOTE_ - Even with no Printer connected, the toast still says "Test ticket sent to printer".

**Card Reader:**

135. Pass ✔️
136. Pass ✔️
137. Pass ✔️
138. Pass ✔️
139. Waiting for device to become low on battery
140. Pass ✔️
141. Pass ✔️

**Terminal:**

142. Pass ✔️
143. Pass ✔️
144. Pass ✔️
145. Pass ✔️
146. Pass ✔️

**Order Routing:**

147. Pass ✔️
148. Pass ✔️

**Order Preferences:**

149. Pass ✔️
150. <a id="fail-150"></a>**Fail** ❌: This option does not exist.
151. Pass ✔️

**Venue Status:**

152. Pass ✔️: _NOTE_ - This is only a toggle, so it won't switch between `Open / Paused / Closed` here.
153. Pass ✔️: See Above.

**Account:**

154. <a id="fail-154"></a>**Fail** ❌: Only displays `Venue ID` info & `Sign Out` button.
155. <a id="semi-155"></a>_Semi-Pass_ ⚠️: See [Test 9.](fail-9) `Sign-in` Section.

**Diagnostics:**

156. Pass ✔️
157. Pass ✔️
158. Pass ✔️
159. Pass ✔️
160. **Cannot Test:** No Custom G700
161. **Cannot Test:** Don't have access to Logcat

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 7. Reports {#reports}

---

**Live Reports:**

162. Pass ✔️
163. Pass ✔️
164. Pass ✔️

**Print Daily Stats:**

165. Pass ✔️
166. <a id="fail-166"></a>**Fail** ❌: Cash Orders via POS do not show on the printout. They are excluded and instead show the total for all other orders correctly.

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 8. Menus {#menus}

---

**Menu Management:**

167. Pass ✔️
168. Pass ✔️
169. Pass ✔️
170. Pass ✔️
171. Pass ✔️
172. Pass ✔️

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 9. Hardware Integration {#hardware-integration}

---

**Printer - SILK/SUNMI (USB + Bluetooth):**

173. Pass ✔️
174. Pass ✔️
175. Pass ✔️
176. Pass ✔️
177. Pass ✔️
178. Pass ✔️
179. Pass ✔️

**Printer - TREK / CUSTOM G70.0 (Bluetooth):**

180. **Cannot Test**
181. **Cannot Test**
182. **Cannot Test**

**Cash Drawer - TREK Direct Port (APOS SDK):**

183. **Cannot Test**
184. **Cannot Test**
185. **Cannot Test**
186. **Cannot Test**

**Stripe Card Reader (M2):**

187. Pass ✔️
188. Pass ✔️: Though no way to verify it is correct
189. Pass ✔️
190. Pass ✔️
191. Pass ✔️

**Additional Notes:**

- In the Android Settings section for `USB`, if `Connect to PC` is toggled on, the USB Printer is not able to connect.
- **M2 Connectivity Issues:** When no internet is present (disabling WiFi), it shows the correct error message of `Discovery Failed`. However, when loss of internet is present, but WiFi is active (tested via setting an incorrect Static IP address), the device attempts to connect, and then the app crashes.

<sub>[Return to Top](#toc)</sub>

## 10. Kiosk {#kiosk}

---

**Welcome Screen & Attract Loop:**

192. Pass ✔️
193. Pass ✔️
194. Pass ✔️

**Menu Browsing:**

195. Pass ✔️
196. Pass ✔️
197. <a id="fail-197"></a>**Fail** ❌: Setting `Out-of-Stock Action` to `Disable` or `Hide` has no effect when inventory levels are less than 0. Is this implemented?
198. <a id="semi-198"></a>_Semi-Pass_ ⚠️: Not added directly to the cart. It prompts for `Special Instructions`, but does not require anything else.
199. Pass ✔️
200. Pass ✔️
201. Pass ✔️
202. Pass ✔️

**Order Summary / Cart:**

203. Pass ✔️
204. Pass ✔️
205. Pass ✔️
206. Pass ✔️
207. <a id="fail-207"></a>**Fail** ❌: At no point, anywhere, are tips shown/able to be added.
208. <a id="fail-208"></a>**Fail** ❌: At no point, whether item-level or venue-level, are Customer Fields shown/presented/required.
209. <a id="semi-209"></a>_Semi-Pass_ ⚠️: It does not contain item-level fields

**Checkout - Credit Card:**

210. N/A - Only Credit Card is implemented
211. Pass ✔️: Automatically selects Credit Card, but it does complete the Stripe M2 flow successfully
212. Pass ✔️
213. Pass ✔️
214. Pass ✔️
215. Pass ✔️

**Checkout - Cash (if applicable):**

216. N/A
217. N/A
218. N/A

**Receipt Options:**

219. Pass ✔️
220. Pass ✔️
221. Pass ✔️
222. Pass ✔️
223. Pass ✔️

**Screen Size & Layout:**

224. **N/A:** On my Tablet, it looks absolutely awful, but we control what devices this is App is run on.
225. Pass ✔️
226. Pass ✔️: On my Terminal at least.

**Kiosk Settings (PIN-Protected):**

227. Pass ✔️
228. Pass ✔️
229. Pass ✔️: _NOTE_ - Does not have `Terminal Assignment`. Not implemented.
230. Pass ✔️

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## 11. Connectivity & Resilience {#connectivity-resilience}

---

**Network Loss - Full Disconnection:**

231. Pass ✔️
232. Pass ✔️: Bumps down the UI to make room for it
233. Pass ✔️ "Orders are syncing."
234. Pass ✔️

**Network Present - No BlazeBite Connectivity:**

235. <a id="fail-235"></a>**Fail** ❌: No banner is present. Silently fails.
236. **Cannot Test**
237. **Cannot Test**

**App Lifecycle:**

238. Pass ✔️
239. Pass ✔️
240. Pass ✔️: Tested Passively. Have ongoing test happening right now.
241. Pass ✔️

**Multi-Device Consistency:**

242. Pass ✔️
243. Pass ✔️
244. Pass ✔️

**Additional Notes:**

<sub>[Return to Top](#toc)</sub>

## List of Notable Findings {#notable-findings}

---

### Failed Tests {#failed-tests}

1. [Test 5](#fail-5)
2. [Test 9](#fail-9)
3. [Test 27](#fail-27)
4. [Test 89](#fail-89)
5. [Test 101](#fail-101)
6. [Test 106](#fail-106)
7. [Test 107](#fail-107)
8. [Test 114](#fail-114)
9. [Test 121](#fail-121)
10. [Test 150](#fail-150)
11. [Test 154](#fail-154)
12. [Test 166](#fail-166)
13. [Test 197](#fail-197)
14. [Test 207](#fail-207)
15. [Test 208](#fail-208)
16. [Test 235](#fail-235)

### Semi-Passed/Failed Tests {#semi-passed-semi-failed-tests}

1. [Test 6](#semi-6)
2. [Test 32](#semi-32)
3. [Test 57](#semi-57)
4. [Test 67](#semi-67)
5. [Test 68](#semi-68)
6. [Test 69](#semi-69)
7. [Test 132](#semi-132)
8. [Test 155](#semi-155)
9. [Test 198](#semi-198)
10. [Test 209](#semi-209)
