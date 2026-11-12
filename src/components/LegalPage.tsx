// Terms of Service and Privacy Policy (pages /terms and /privacy).
// Every statement here must match how the site actually works: pickup-only ordering,
// payments through Square (server/square.ts), hosting on Cloudflare (worker/index.ts),
// cart + pickup choice in localStorage (App.tsx), Cloudflare Web Analytics (cookieless), no cookies of our own.
// If any of that changes, update the text and the effective date.
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { SHOP } from '../lib/catalog';
import { Hov, IconBack } from '../lib/ui';

export type LegalDoc = 'terms' | 'privacy';

const EFFECTIVE = 'November 10, 2026';
const INK = '#1A1414';
const RED = '#D7192D';
const GREY = '#636366';

interface Section { id: string; title: string; body: ReactNode }

/* ---------- small text helpers ---------- */
const S = {
  p: { margin: 0 } as CSSProperties,
  ul: { margin: 0, paddingLeft: '1.25em', display: 'flex', flexDirection: 'column', gap: 8 } as CSSProperties,
  h3: { margin: '8px 0 0', fontSize: 18, fontWeight: 800, letterSpacing: '-.01em', color: INK } as CSSProperties,
  a: { color: RED, fontWeight: 600 } as CSSProperties,
};
const P = ({ children }: { children: ReactNode }) => <p style={S.p}>{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul style={S.ul}>{children}</ul>;
const H3 = ({ children }: { children: ReactNode }) => <h3 style={S.h3}>{children}</h3>;
const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" style={S.a}>{children}</a>
);
const Tel = () => <a href={SHOP.phoneHref} style={S.a}>{SHOP.phoneText}</a>;
const ADDRESS = 'Pizza King & Pasta, 511 Ray Lawson Blvd, Unit 10, Brampton, ON L6Y 0N2, Canada';

/* ---------- Terms of Service ---------- */
const TERMS_INTRO = (
  <>
    <P>
      These Terms of Service (the “Terms”) apply when you use this website or place an online pickup order with Pizza King &amp; Pasta
      (“Pizza King &amp; Pasta”, “we”, “us” or “our”), 511 Ray Lawson Blvd, Unit 10, Brampton, Ontario. By using the website or placing an
      order, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use the website. You can still order
      by phone or at the counter.
    </P>
    <P>Please read the sections on allergens, alcohol and refunds before you order.</P>
  </>
);

const terms = (goOther: (e?: MouseEvent) => void): Section[] => [
  {
    id: 'about',
    title: 'About us',
    body: (
      <>
        <P>
          This website is operated by Pizza King &amp; Pasta, a restaurant located at 511 Ray Lawson Blvd, Unit 10, Brampton, ON L6Y 0N2, Canada.
          You can reach us by phone at <Tel /> during our opening hours (daily, 4 PM to 2 AM, subject to holiday changes), or by mail at
          the address above.
        </P>
      </>
    ),
  },
  {
    id: 'use',
    title: 'Using this website',
    body: (
      <>
        <P>You may use this website to view our menu and place pickup orders for yourself or others. You agree not to:</P>
        <UL>
          <li>place false, fraudulent or prank orders, or use a payment method you are not authorized to use;</li>
          <li>interfere with the website’s operation or security, or try to access systems or data you are not permitted to access;</li>
          <li>use automated tools to place orders or copy the website’s content; or</li>
          <li>use the website for any unlawful purpose.</li>
        </UL>
        <P>We may refuse orders from, or limit access by, anyone who breaches these Terms.</P>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Who can order',
    body: (
      <>
        <P>
          To place an order you must be at least 18 years old (the age of majority in Ontario), or be ordering with the permission and
          supervision of a parent or guardian. You must be at least 19 years old to order alcohol (see “Alcohol” below).
        </P>
        <P>
          You agree to give accurate contact details so that we can reach you about your order. You are responsible for orders placed
          using your name, contact details and payment method.
        </P>
      </>
    ),
  },
  {
    id: 'pickup-delivery',
    title: 'Pickup only; delivery through third parties',
    body: (
      <>
        <P>
          Orders placed on this website are for pickup at our restaurant only. We do not deliver orders placed on this website.
        </P>
        <P>
          For delivery, the website links to our storefronts on DoorDash and Uber Eats. Those orders are placed with, paid to and delivered
          by those companies under their own terms of service and privacy policies, and their menus, prices, fees, taxes, delivery times and
          refund processes may differ from ours. Questions about a delivery order, its fees or its refund should go to the delivery company
          first. We are not responsible for their apps, websites, drivers or policies.
        </P>
      </>
    ),
  },
  {
    id: 'menu',
    title: 'Menu, photos and descriptions',
    body: (
      <>
        <UL>
          <li>
            Photos on this website are for illustration only. Many are stock or representative images. Your food may look different, for
            example in size, colour, topping placement, char from the wood-fired oven, and packaging.
          </li>
          <li>
            We try to keep menu descriptions accurate, but recipes, ingredients and suppliers can change. If an item or ingredient is
            unavailable, we will contact you before making a substitution. If we cannot reach you, we will leave that item out and refund
            it.
          </li>
          <li>
            Spice levels (such as “little spicy” or “extra spicy”) are approximate. Heat varies from batch to batch and from person to
            person.
          </li>
          <li>Menu items, prices, deals and availability can change at any time without notice, and items may sell out.</li>
        </UL>
      </>
    ),
  },
  {
    id: 'prices',
    title: 'Prices, taxes and payment',
    body: (
      <>
        <UL>
          <li>All prices are in Canadian dollars.</li>
          <li>
            Menu prices do not include tax. Harmonized Sales Tax (HST) of 13% is added at checkout. The total, including tax, is shown
            before you pay, and that is the amount we charge.
          </li>
          <li>
            Online orders are paid at checkout. Payments are processed by Square, our payment processor, by credit or debit card, Apple Pay
            or Google Pay, depending on your device. By paying, you authorize us to charge the order total to your payment method.
          </li>
          <li>
            Your card details are entered into a secure form provided by Square and go directly to Square. We do not see or store your full
            card number. Square’s own terms and privacy notice apply to its processing of your payment.
          </li>
          <li>
            Deals and combos are available only on the terms shown with them, cannot be combined with other offers unless we say so, and may
            end at any time. A deal included in an order we have already accepted will be honoured.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: 'errors',
    title: 'Pricing and other errors',
    body: (
      <>
        <P>
          We try hard to keep prices and descriptions correct, but mistakes can happen. If we find an obvious error in the price or
          description of an item you ordered, we will try to contact you before we prepare the order. You can then choose to go ahead at the
          correct price or cancel for a full refund. If we cannot reach you in time, we may cancel the affected item or order and refund you
          in full.
        </P>
        <P>We will never charge you more than the total you approved at checkout without your agreement.</P>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Placing an order and confirmation',
    body: (
      <>
        <P>
          When you place an order, you are offering to buy the items in your cart. After your payment is approved, the website shows a
          confirmation screen with your order number and order details, and a link to your Square receipt when one is available. Please keep
          this for your records. If you need a copy of your order details or receipt, call us and we will provide one.
        </P>
        <P>
          We may decline or cancel an order, for example if an item is unavailable, the order appears fraudulent, we are unable to prepare
          it before closing, or circumstances beyond our control prevent us from filling it. If we cancel an order you have paid for, we will
          refund the full amount to your original payment method.
        </P>
      </>
    ),
  },
  {
    id: 'pickup',
    title: 'Pickup times',
    body: (
      <>
        <UL>
          <li>
            Pickup times are estimates. For “as soon as possible” orders, we usually aim for about 20 minutes, but busy periods can take
            longer. For scheduled orders, we aim to have your food ready at the time you chose.
          </li>
          <li>
            When you arrive, give your name or order number at the counter. Please check your order before you leave.
          </li>
          <li>If we are running late or have a question about your order, we may call, text or email you using the details you provided.</li>
        </UL>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Changes and cancellations by you',
    body: (
      <>
        <P>
          Food is made fresh to order, often within minutes of being placed. To change or cancel an order, call us at <Tel /> as soon as
          possible. If we have not started preparing it, we will cancel the order and refund it in full. Once preparation has started, we may
          not be able to change, cancel or refund the order, except where the law requires otherwise.
        </P>
      </>
    ),
  },
  {
    id: 'unclaimed',
    title: 'Unclaimed orders',
    body: (
      <>
        <P>
          For food safety, we cannot hold prepared food indefinitely. If an order is not picked up within 1 hour of its estimated ready time,
          or by closing time if that is earlier, we may discard it. Unclaimed orders are not refunded, except where the law requires
          otherwise. We are not responsible for the quality of food collected long after it was ready.
        </P>
      </>
    ),
  },
  {
    id: 'refunds',
    title: 'Problems with your order and refunds',
    body: (
      <>
        <P>
          If something is missing, incorrect or not up to standard, tell us at the counter or call <Tel /> as soon as possible, ideally the
          same day and no later than 24 hours after pickup, so we can look into it while details are fresh. We may ask for your order number,
          a photo or the item itself.
        </P>
        <P>
          Depending on the problem, we may remake or replace the item, or give a full or partial refund. Refunds go back to your original
          payment method through Square. Your bank or card issuer controls when the refund appears on your statement, which can take several
          business days.
        </P>
        <P>
          This section does not limit any right you have under the law. If you have a problem with a charge, please contact us first. We can
          usually fix it faster than a card dispute can.
        </P>
      </>
    ),
  },
  {
    id: 'allergens',
    title: 'Allergens, dietary needs and food safety',
    body: (
      <>
        <P>
          <strong>Our kitchen is shared.</strong> We handle and cook with ingredients that contain common allergens, including wheat and
          gluten, milk, eggs and soy, and may also handle sesame, mustard, fish, shellfish, peanuts, tree nuts and sulphites. All items are
          prepared with shared surfaces, utensils, ovens and fryers, so cross-contact can happen.
        </P>
        <UL>
          <li>
            <strong>We cannot guarantee that any item is free of any allergen.</strong> Ingredient information from our suppliers can change.
          </li>
          <li>
            If you or anyone you are ordering for has a food allergy or intolerance, <strong>call us at <Tel /> before ordering</strong> to
            ask about ingredients, and remind staff when you pick up. A note in the online order is not a guarantee that your needs can be met.
            If you have a severe allergy, you may decide that our food is not safe for you.
          </li>
          <li>
            Items marked vegetarian contain no meat in the recipe, but they are prepared in the same kitchen and ovens as meat items.
          </li>
          <li>
            Our food is not certified halal or kosher, and we make no claim that any item meets halal, kosher or any other religious dietary
            standard. We also make no gluten-free, vegan or allergen-free claims unless an item is clearly labelled that way on the menu.
          </li>
          <li>
            Hot food and drinks can cause burns. Please take care, and refrigerate leftovers promptly.
          </li>
        </UL>
      </>
    ),
  },
  {
    id: 'alcohol',
    title: 'Alcohol',
    body: (
      <>
        <P>
          Beer and any other alcohol are sold only in accordance with our liquor licence and Ontario law, including the{' '}
          <em>Liquor Licence and Control Act, 2019</em>.
        </P>
        <UL>
          <li>You must be at least 19 years old to order or pick up alcohol.</li>
          <li>
            The person picking up an order that contains alcohol must be 19 or older and show valid, unexpired, government-issued photo
            identification (such as a driver’s licence, passport or Ontario Photo Card).
          </li>
          <li>
            We will refuse to hand over alcohol to anyone who is under 19, cannot show valid ID, appears intoxicated, or who we believe is
            buying it for someone under 19. In that case, we will keep the alcohol and refund its price; the rest of your order will still be
            available.
          </li>
          <li>Alcohol may only be sold during the hours permitted by law. Please drink responsibly and never drink and drive.</li>
        </UL>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party services and links',
    body: (
      <P>
        The website uses or links to services run by other companies, including Square (payments), DoorDash and Uber Eats (delivery), and
        Google Maps (maps and directions). Those services are governed by their own terms and privacy policies. We do not control them and
        are not responsible for their content, availability or practices.
      </P>
    ),
  },
  {
    id: 'ip',
    title: 'Our content',
    body: (
      <>
        <P>
          The Pizza King &amp; Pasta name and logo, and the website’s text, design and original photos, belong to us or to the people who
          licensed them to us. Some photos are used under licence from Unsplash and Wikimedia Commons contributors, as credited below.
          You may view and share pages for personal, non-commercial use, but you may not copy, reproduce or reuse our content for commercial
          purposes without our written permission.
        </P>
        <H3>Photo credits</H3>
        <P>
          Food and stock photos from <Ext href="https://unsplash.com">Unsplash</Ext>, used under the{' '}
          <Ext href="https://unsplash.com/license">Unsplash License</Ext>. Juice photo by JIP and Napoli pizza photo by Robot8A, both licensed under{' '}
          <Ext href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</Ext>; tandoori pizza photo by mroach, licensed under{' '}
          <Ext href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</Ext>; Hawaiian pizza photo by Elsie Hui, licensed under <Ext href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</Ext>; all via{' '}
          <Ext href="https://commons.wikimedia.org">Wikimedia Commons</Ext>. Some photos have been cropped or edited.
        </P>
      </>
    ),
  },
  {
    id: 'availability',
    title: 'Website availability',
    body: (
      <P>
        We may change, suspend or stop any part of the website at any time. We work to keep it accurate and available, but, to the extent
        permitted by law, the website is provided “as is” and “as available”, and we do not promise that it will always be uninterrupted,
        error-free or free of harmful components. This does not affect the quality of the food we sell to you, which is covered by the
        warranties and conditions that the law gives you.
      </P>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <P>To the extent permitted by law:</P>
        <UL>
          <li>
            we are not liable for indirect, incidental, special, consequential or punitive damages, or for loss of profits, data or
            opportunity, arising from your use of the website or from an order; and
          </li>
          <li>
            our total liability for any claim relating to an order is limited to the amount you paid for that order, and our total liability
            for any other claim relating to the website is limited to $100.
          </li>
        </UL>
        <P>
          Nothing in these Terms excludes or limits any liability that cannot be excluded or limited by law, including liability for death
          or personal injury caused by our negligence, liability for fraud, or any right or remedy you have under the Ontario{' '}
          <em>Consumer Protection Act, 2002</em> or other consumer protection laws.
        </P>
      </>
    ),
  },
  {
    id: 'indemnity',
    title: 'Responsibility for misuse',
    body: (
      <P>
        To the extent permitted by law, you agree to be responsible for losses we suffer because you used the website fraudulently or
        unlawfully or deliberately breached these Terms, such as through a fraudulent order or unauthorized use of a payment method.
      </P>
    ),
  },
  {
    id: 'consumer-rights',
    title: 'Your consumer rights',
    body: (
      <P>
        Nothing in these Terms limits or waives any right you have as a consumer under the Ontario <em>Consumer Protection Act, 2002</em> (or
        any law that replaces it) or other laws that cannot be waived. These Terms do not require you to use arbitration and do not stop you
        from going to court or joining a class action. If any part of these Terms conflicts with those rights, the law prevails.
      </P>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <P>
        These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there. If you have a
        concern, please contact us first and we will try to resolve it. Any dispute that cannot be resolved may be brought before the courts
        of Ontario, including the Small Claims Court, subject to any right you have under consumer protection law to bring a claim elsewhere.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these Terms',
    body: (
      <P>
        We may update these Terms from time to time. The updated version will be posted on this page with a new effective date. Changes do
        not apply to orders placed before the change. By using the website or placing an order after a change is posted, you agree to the
        updated Terms.
      </P>
    ),
  },
  {
    id: 'general',
    title: 'General',
    body: (
      <UL>
        <li>
          These Terms, our{' '}
          <a href="privacy" onClick={goOther} style={S.a}>Privacy Policy</a> and the details shown in your order confirmation are the
          whole agreement between you and us about your use of the website and your online order.
        </li>
        <li>If any part of these Terms is found to be invalid or unenforceable, the rest of the Terms remain in effect.</li>
        <li>If we do not enforce a provision right away, we have not waived our right to enforce it later.</li>
        <li>
          We are not responsible for delays or failures caused by events beyond our reasonable control, such as power or internet outages,
          equipment failure, supply shortages or severe weather. If we cannot fill a paid order for one of these reasons, we will refund it.
        </li>
      </UL>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <P>
        Questions about these Terms or an order? Call us at <Tel /> (daily, 4 PM to 2 AM), or write to us at {ADDRESS}.
      </P>
    ),
  },
];

/* ---------- Privacy Policy ---------- */
const PRIVACY_INTRO = (
  <>
    <P>
      This Privacy Policy explains how Pizza King &amp; Pasta (“we”, “us” or “our”) collects, uses, shares and protects personal
      information through this website and online pickup orders, and the choices and rights you have. We follow the principles of
      Canada’s <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA).
    </P>
  </>
);

const privacy = (goOther: (e?: MouseEvent) => void): Section[] => [
  {
    id: 'summary',
    title: 'The short version',
    body: (
      <UL>
        <li>We collect what we need to make your pickup order and get it to you: your name, phone number, email, order and any kitchen note.</li>
        <li>Your card details go straight to Square, our payment processor. We never see or store your full card number.</li>
        <li>We use privacy-friendly visitor statistics that do not use cookies or identify you. We do not use advertising trackers or tracking cookies, and we do not sell or rent your personal information.</li>
        <li>We only email you about your order. We do not send marketing emails unless you have agreed to receive them.</li>
        <li>You can ask to see or correct your information at any time by calling <Tel /> or writing to us.</li>
      </UL>
    ),
  },
  {
    id: 'accountability',
    title: 'Who is responsible',
    body: (
      <P>
        Pizza King &amp; Pasta, 511 Ray Lawson Blvd, Unit 10, Brampton, ON L6Y 0N2, is responsible for personal information under its control. Our
        owner or manager acts as our privacy contact and is accountable for our compliance with this policy. You can reach them by phone at{' '}
        <Tel /> or by mail at the address above, marked “Attention: Privacy”.
      </P>
    ),
  },
  {
    id: 'collect',
    title: 'Information we collect',
    body: (
      <>
        <H3>Information you give us when you order</H3>
        <UL>
          <li>your name, phone number and email address;</li>
          <li>the items in your order, your choices (such as size, toppings and spice level), and your pickup time; and</li>
          <li>any note you add for the kitchen.</li>
        </UL>
        <H3>Payment information</H3>
        <P>
          Card payments are entered into a secure form that Square hosts within our checkout page. Your card number, expiry date, security
          code and postal code go directly to Square and are never sent to or stored by us. When you pay with Apple Pay or Google Pay, your
          payment is handled by your wallet provider and Square. To verify a payment and help prevent fraud, Square may receive your name,
          email address, phone number and country, along with information about your device and browser. From Square we receive only the
          payment result, the card brand, the last four digits of the card, and a receipt number and link.
        </P>
        <H3>Information stored in your browser</H3>
        <P>
          The website saves your cart and your pickup choice (such as “as soon as possible” or a scheduled time) in your browser’s local
          storage so that they are still there if you reload the page. This information stays on your device and is not sent to us unless
          you place an order. Your cart is cleared after a successful order. You can remove it at any time by clearing your browser’s site
          data.
        </P>
        <H3>Technical information</H3>
        <P>
          Like all websites, ours receives some technical information when you visit, such as your IP address, browser type, the pages you
          request and the time of the request. Our hosting provider, Cloudflare, processes this to deliver the website and protect it
          against abuse. We do not use it to identify you or build a profile about you.
        </P>
        <H3>Visitor statistics</H3>
        <P>
          We use Cloudflare Web Analytics to understand how the website is used, for example how many people visit, which pages they view,
          which website or app they came from, the type of device and browser, the approximate country or region, and how quickly pages
          load. It does not use cookies or local storage, does not track you across other websites, and does not build a profile about
          you. We only see totals, not information about individual visitors.
        </P>
        <H3>When you contact us</H3>
        <P>If you call or write to us, we collect what you choose to tell us so that we can respond.</P>
        <H3>What we do not collect</H3>
        <P>
          We do not use advertising pixels, social media trackers or analytics that follow you across websites. We do not ask for delivery addresses, because delivery
          is handled by DoorDash and Uber Eats, and the website does not have user accounts or passwords.
        </P>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: (
      <>
        <P>We use personal information only for these purposes:</P>
        <UL>
          <li>to prepare your order and hand it to you at pickup;</li>
          <li>to contact you about your order, for example if an item is unavailable, we have a question about your note, or we are running late;</li>
          <li>to process your payment and any refunds, and to help prevent fraud;</li>
          <li>to provide or make available your receipt;</li>
          <li>to keep the business and tax records the law requires;</li>
          <li>to respond to your questions, complaints and requests;</li>
          <li>to keep the website secure and working; and</li>
          <li>to meet our legal obligations, including those for selling alcohol.</li>
        </UL>
        <P>We will not use your information for any other purpose without your consent, unless the law requires or permits it.</P>
      </>
    ),
  },
  {
    id: 'consent',
    title: 'Your consent',
    body: (
      <>
        <P>
          By placing an order, you consent to us collecting, using and sharing your information as described in this policy. We will ask
          for your express consent before using it for any new purpose.
        </P>
        <P>
          You can withdraw your consent at any time, subject to legal or contractual limits, by contacting us. However, we need your name,
          phone number, email and payment to process an online order. If you prefer not to provide them online, you are welcome to order by
          phone or at the counter.
        </P>
        <P>
          If you mention an allergy or other health information in your kitchen note, we use it only to prepare your order. The note is
          stored with your order in Square, so please include only what the kitchen needs. For serious allergies, please call us before
          ordering.
        </P>
      </>
    ),
  },
  {
    id: 'share',
    title: 'Who we share it with',
    body: (
      <>
        <P>We share personal information only with the service providers that help us run the website and fill your order, and only as needed:</P>
        <UL>
          <li>
            <strong>Square</strong> processes your payment. Your order, including your name, phone number, email, items, kitchen note and pickup
            time, is recorded in our Square account so that our staff can see and prepare it. Depending on our Square account settings, Square
            may also save these details to a customer record in our Square account. Square also uses payment information for its own purposes,
            such as fraud prevention and legal compliance, as described in{' '}
            <Ext href="https://squareup.com/ca/en/legal/general/privacy">Square’s privacy notice</Ext>.
          </li>
          <li>
            <strong>Cloudflare</strong> hosts the website, runs the server that sends your order and payment to Square, and provides our
            cookieless visitor statistics (Cloudflare Web Analytics). See{' '}
            <Ext href="https://www.cloudflare.com/privacypolicy/">Cloudflare’s privacy policy</Ext>.
          </li>
          <li>
            <strong>Google</strong> provides the website’s font (Google Fonts) and the map shown when you start an order (Google Maps). When
            these load, Google receives your IP address and browser information, and the embedded map may set cookies. See{' '}
            <Ext href="https://policies.google.com/privacy">Google’s privacy policy</Ext>.
          </li>
          <li>
            <strong>Unsplash</strong> hosts many of the food photos on the website. When they load, Unsplash receives your IP address and
            browser information. See <Ext href="https://unsplash.com/privacy">Unsplash’s privacy policy</Ext>.
          </li>
        </UL>
        <P>
          If you choose to order delivery through DoorDash or Uber Eats, you leave our website. We do not send them your information; they
          collect it themselves under their own privacy policies.
        </P>
        <P>
          We may also disclose personal information if the law requires or permits it, for example in response to a court order or valid
          request from law enforcement, to investigate fraud, or to protect our rights or someone’s safety. If our business is sold, personal
          information may be transferred to the new owner, who must protect it as described in this policy.
        </P>
        <P><strong>We do not sell or rent personal information, and we do not share it with anyone for their own marketing.</strong></P>
      </>
    ),
  },
  {
    id: 'outside-canada',
    title: 'Storage outside Canada',
    body: (
      <P>
        Our service providers may store and process personal information outside Canada, including in the United States. While it is
        there, it is subject to the laws of that country and may be accessed by its courts, law enforcement and national security
        authorities.
      </P>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <UL>
        <li>Information saved in your browser stays there until your order is placed or you clear your browser’s site data.</li>
        <li>
          Order and payment records are kept in our Square account for as long as we need them for the purposes above and to meet legal
          requirements. Canadian tax law generally requires businesses to keep their records for six years from the end of the tax year they
          relate to. After that, we delete records or make them anonymous where our systems allow.
        </li>
        <li>If we use your information to make a decision about you, such as a refund request, we keep it long enough for you to ask to see it.</li>
        <li>Technical logs are kept by Cloudflare under its own retention practices.</li>
      </UL>
    ),
  },
  {
    id: 'safeguards',
    title: 'How we protect it',
    body: (
      <>
        <P>We use safeguards suited to the sensitivity of the information, including:</P>
        <UL>
          <li>encrypted (HTTPS) connections for the website and checkout;</li>
          <li>a payment form hosted by Square, so card details never reach our website or server;</li>
          <li>keeping the credentials for our Square account on the server, never in the website code; and</li>
          <li>limiting access to order information to staff who need it to fill orders and handle questions.</li>
        </UL>
        <P>
          No method of transmission or storage is completely secure, so we cannot guarantee absolute security. If a breach of security
          involving your personal information creates a real risk of significant harm, we will notify you and the Office of the Privacy
          Commissioner of Canada as the law requires.
        </P>
      </>
    ),
  },
  {
    id: 'messages',
    title: 'Emails and other messages',
    body: (
      <P>
        We use your email address and phone number only for messages about your order, such as your receipt, order updates, or questions
        about your order. These are transactional messages. In line with Canada’s anti-spam legislation (CASL), we will not send you
        promotional emails or texts unless you have given us your consent. If we ever offer a mailing list, joining it will be optional, and
        every message will include a way to unsubscribe.
      </P>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and browser storage',
    body: (
      <>
        <P>
          Our website does not set its own cookies and does not use analytics or advertising cookies. Our visitor statistics (Cloudflare
          Web Analytics) work without cookies. The website uses your browser’s local storage
          only to remember your cart and pickup choice, as described above.
        </P>
        <P>Some third-party services we use may set their own cookies or similar technologies:</P>
        <UL>
          <li>the embedded Google Map, when it loads;</li>
          <li>Square’s payment form, for security and fraud prevention during checkout; and</li>
          <li>Cloudflare, which may set strictly necessary security cookies to protect the website from abuse.</li>
        </UL>
        <P>
          You can block or delete cookies and site data in your browser settings. If you block them, some features, such as checkout, may
          not work properly.
        </P>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights: access and correction',
    body: (
      <>
        <P>You have the right to:</P>
        <UL>
          <li>ask whether we hold personal information about you, and get a copy of it;</li>
          <li>ask how it has been used and to whom it has been disclosed;</li>
          <li>ask us to correct information that is inaccurate or incomplete; and</li>
          <li>withdraw your consent, as described above.</li>
        </UL>
        <P>
          To make a request, call us at <Tel /> or write to us at {ADDRESS}, marked “Attention: Privacy”. We may need to confirm your
          identity before we respond. We will respond within 30 days, or tell you within that time if we need more time and why, as the law
          allows. Requests are free, unless we tell you about a reasonable cost in advance. If we cannot give you access to some information,
          we will explain why, subject to any legal restrictions, and tell you what you can do next.
        </P>
      </>
    ),
  },
  {
    id: 'complaints',
    title: 'Questions and complaints',
    body: (
      <>
        <P>
          If you have a question or concern about how we handle personal information, please contact us first at <Tel /> or by mail, and we
          will look into it.
        </P>
        <P>
          If you are not satisfied with our response, you can file a complaint with the Office of the Privacy Commissioner of Canada:{' '}
          <Ext href="https://www.priv.gc.ca/en/report-a-concern/">priv.gc.ca</Ext>, toll-free 1-800-282-1376, or 30 Victoria Street,
          Gatineau, Quebec K1A 1H3.
        </P>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <P>
        This website is not directed at children under 13, and we do not knowingly collect personal information from them. Anyone under 18
        should order with a parent’s or guardian’s permission. If you believe a child has given us personal information, please contact us
        and we will delete it unless we are required to keep it.
      </P>
    ),
  },
  {
    id: 'links',
    title: 'Other websites',
    body: (
      <P>
        Our website links to other sites, such as DoorDash, Uber Eats, Google Maps and photographers’ pages on Unsplash. This policy does not
        apply to them. Please read their privacy policies before giving them personal information.
      </P>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <P>
        We may update this policy, for example if the website or the services we use change. The updated version will be posted on this
        page with a new effective date. If we want to use your personal information for a new purpose, we will ask for your consent first.
        Please also see our <a href="terms" onClick={goOther} style={S.a}>Terms of Service</a>.
      </P>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <P>
        Privacy questions or requests: call <Tel /> (daily, 4 PM to 2 AM), or write to {ADDRESS}, marked “Attention: Privacy”.
      </P>
    ),
  },
];

/* ---------- Page ---------- */
const DOCS: Record<LegalDoc, { title: string; intro: ReactNode; sections: (go: (e?: MouseEvent) => void) => Section[]; other: string }> = {
  terms: { title: 'Terms of Service', intro: TERMS_INTRO, sections: terms, other: 'Privacy Policy' },
  privacy: { title: 'Privacy Policy', intro: PRIVACY_INTRO, sections: privacy, other: 'Terms of Service' },
};

const st = {
  wrap: { maxWidth: 1320, margin: '0 auto', padding: 'clamp(28px,5vw,56px) clamp(16px,3vw,32px) 96px', fontFamily: "'Figtree', system-ui, sans-serif", color: INK } as CSSProperties,
  col: { maxWidth: '70ch', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40, fontSize: 17, lineHeight: 1.65, overflowWrap: 'anywhere' } as CSSProperties,
  back: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px 0 14px', border: 0, borderRadius: 999, background: '#F0F0F3', color: INK, fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'background .2s' } as CSSProperties,
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: RED } as CSSProperties,
  h1: { margin: 0, fontWeight: 900, fontSize: 'clamp(36px,6vw,60px)', lineHeight: 1, letterSpacing: '-.04em', textWrap: 'balance' } as CSSProperties,
  meta: { margin: 0, fontSize: 15, fontWeight: 600, color: GREY } as CSSProperties,
  toc: { background: '#F6F6F8', borderRadius: 20, padding: 'clamp(18px,3vw,28px)', display: 'flex', flexDirection: 'column', gap: 12 } as CSSProperties,
  tocHead: { margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: GREY } as CSSProperties,
  tocList: { margin: 0, paddingLeft: '1.6em', columns: '16rem 2', columnGap: 32, fontSize: 15, lineHeight: 1.5 } as CSSProperties,
  tocLink: { color: INK, textDecoration: 'none', fontWeight: 600 } as CSSProperties,
  section: { display: 'flex', flexDirection: 'column', gap: 14, scrollMarginTop: 88 } as CSSProperties,
  h2: { margin: 0, fontWeight: 800, fontSize: 'clamp(22px,2.4vw,26px)', lineHeight: 1.2, letterSpacing: '-.02em' } as CSSProperties,
  num: { color: RED, marginRight: 10 } as CSSProperties,
  body: { display: 'flex', flexDirection: 'column', gap: 14, color: '#2C2626' } as CSSProperties,
  foot: { borderTop: '1px solid #E4E4E7', paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: GREY } as CSSProperties,
};

export default function LegalPage({ doc, onBack, onOther }: { doc: LegalDoc; onBack: () => void; onOther: (e?: MouseEvent) => void }) {
  const d = DOCS[doc];
  const sections = d.sections(onOther);
  const jump = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  };

  return (
    <main style={st.wrap}>
      <article style={st.col} aria-labelledby="legal-title">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Hov as="button" type="button" onClick={onBack} style={st.back} hover={{ background: '#E6E6E9' }}>
            <IconBack size={16} stroke={2.8} />
            Back
          </Hov>
          <span style={st.eyebrow}>Pizza King &amp; Pasta</span>
          <h1 id="legal-title" style={st.h1}>{d.title}</h1>
          <p style={st.meta}>Effective date: {EFFECTIVE}</p>
          <div style={st.body}>{d.intro}</div>
        </div>

        <nav aria-label="Contents" style={st.toc}>
          <h2 style={st.tocHead}>Contents</h2>
          <ol style={st.tocList}>
            {sections.map((s) => (
              <li key={s.id} style={{ breakInside: 'avoid', padding: '3px 0' }}>
                <Hov as="a" href={'#' + doc + '-' + s.id} onClick={jump(doc + '-' + s.id)} style={st.tocLink} hover={{ color: RED }}>
                  {s.title}
                </Hov>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={doc + '-' + s.id} tabIndex={-1} style={{ ...st.section, outline: 'none' }} aria-labelledby={doc + '-' + s.id + '-h'}>
            <h2 id={doc + '-' + s.id + '-h'} style={st.h2}>
              <span style={st.num}>{i + 1}.</span>
              {s.title}
            </h2>
            <div style={st.body}>{s.body}</div>
          </section>
        ))}

        <div style={st.foot}>
          <span>Effective date: {EFFECTIVE}</span>
          <span>
            See also our{' '}
            <a href={doc === 'terms' ? 'privacy' : 'terms'} onClick={onOther} style={S.a}>{d.other}</a>.
          </span>
        </div>
      </article>
    </main>
  );
}
