# Al Noor Hospital, Tirur — Website

A static, responsive website built with plain **HTML, CSS and JavaScript**. It needs no framework and no build step, so it can be uploaded to any web host (cPanel, Hostinger, Netlify, Vercel, GitHub Pages).

## Pages (24)
| Page | File |
|---|---|
| Home | `index.html` |
| About | `about.html` |
| Departments | `departments.html` |
| Department pages (7) | `department-*.html` |
| Doctors directory | `doctors.html` |
| Doctor profiles (10) | `doctor-*.html` |
| Emergency | `emergency.html` |
| Contact | `contact.html` |
| Book Appointment | `book-appointment.html` |

## Structure
```
assets/
  css/style.css      → all styles (colours, fonts and spacing are set as variables at the top)
  js/data.js         → departments & doctors list (used by the booking forms)
  js/main.js         → menu, booking widget, booking flow, doctor filter, forms
  img/               → hero.jpg, logo.png, doctors/*.jpg
```

## Features
- Booking widget in the hero section: choosing a department filters the doctor list, plus date chips and mobile-number validation.
- 3-step **Book Appointment** flow (department & doctor → date & time → patient details), ending on a confirmation with a reference number.
  - Pre-fill from links: `book-appointment.html?doctor=manu` or `?dept=or`
- Every booking and the contact form open a **pre-filled WhatsApp message** to the hospital (number set in `assets/js/data.js` → `whatsapp`).
- Doctor search and department filter (`doctors.html?dept=gy&q=rama`).
- Side booking card on every department and doctor page.
- Mobile menu drawer, a sticky header and a mobile bottom bar (Call / WhatsApp / Book).
- Scroll-reveal animations (switched off for visitors who set "reduce motion").
- SEO: page titles, meta descriptions, Open Graph tags and Hospital schema (JSON-LD) on the home page.

## Before going live: replace the placeholders
Search all files for `[` to find them:
- `[OP TIMINGS]`, `[OP TIME]`, `[EMAIL ADDRESS]`
- Doctor details: `[QUALIFICATIONS]`, `[X]+` years, `[LANGUAGES]`, education, bio
- Founder photo and message (about.html)
- Parking and insurance FAQs (contact.html)
- Social media links in the footer (`href="#"`)
- Photos for Dr. Abusalih and Dr. Shaharbanu (save them as `assets/img/doctors/abusalih.jpg` and `shaharbanu.jpg`, then set `img` for each in `data.js` and update their `<img>` tags)
- Department "conditions and services" lists, blog articles and booking slot times are sample content: confirm them with the hospital.

## Connecting bookings to a real system
At the moment a booking shows a confirmation on screen and offers a WhatsApp message. To also save bookings automatically, send the form data from `main.js` (`initBookingFlow` → the `s.step === 3` block) to a form service, a Google Sheet or a backend API.
