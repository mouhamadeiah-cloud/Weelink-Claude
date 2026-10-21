# خطة: المعرض مصدر واحد للتصاميم، والشرائح الجاهزة عرض مختار منه

قرارات المستخدم (21 أكتوبر 2026):
- فئات **المتجر والسيارات والمطعم والحجز والتواصل** تبقى ثابتة في الكود (مربوطة ببيانات حيّة أو بنماذج المنصة).
- تصاميم الذكاء الاصطناعي (`hero.*`، `about.*`… بمواضع `aiSlot`) تُنقل لاحقاً، وكتالوج Wee AI (`buildCatalog.json`) يبقى كما هو حتى ذلك الحين.
- **النقل والحذف والترتيب** تحدده الإدارة بنفسها لاحقاً من موقع الإدارة. الآن: **إمكانية الإضافة** فقط.

## المراحل

1. **الإضافة** (منجزة في هذا الفرع): في مراجعة الشرائح، شريحة مقبولة (ليست صفحة) تُضاف إلى فئة من الشرائح الجاهزة (غير الثابتة) أو تُزال منها. تُحفظ في `readySlides/{galleryId}` (الفئة والترتيب فقط؛ الشريحة نفسها تبقى في `gallerySlides`). لوحة «شرائح جاهزة» في المحرر تعرضها تحت شرائح الفئة بالبطاقات نفسها التي في «من معرض التصاميم» وتُضاف بستايل الصفحة.
2. **نسخ الشرائح الجاهزة إلى المعرض (منجزة، ينتظر التشغيل من الإدارة)** كتصاميم رسمية (بذر على نمط `server/gallerySeed.ts`، حالة «معلّقة» حتى مراجعة الإدارة)، والكود يعمل كما هو. لا يتغير شيء للمستخدم. تُوحَّد التصنيفات (قائمة واحدة).
3. **أداة الإدارة للاختيار والنقل والحذف والترتيب** داخل كل فئة، مع إخفاء ما ينقله الكود (علامة مخفية بدل الحذف من الكود).
4. **كتالوج الذكاء الاصطناعي من القاعدة:** يقرأ الخادم قائمة الشرائح الجاهزة التي اختارتها الإدارة (مع مواضع نصوصها `aiSlot`) ويولّد منها الكتالوج في ذاكرة مؤقتة، وتبقى نسخة احتياطية من الملف الحالي. البرومبت كما هو: «اختر شريحة من التالية وعدّل نصوصها فقط».
5. **القلب والتنظيف:** اللوحة تقرأ الشرائح الجاهزة من اختيار الإدارة وحدها، ثم تُحذف المولّدات القديمة ومعاينتها الخاصة (`SlideTemplatePreview`) تدريجياً. لا تظهر لوحة فارغة في أي لحظة لأن الكود يعمل حتى هذه المرحلة.

## ملاحظات
- لا حقول جديدة في الشريحة: التصنيف والترتيب في وثيقة `readySlides` فقط.
- قواعد Firestore: `readySlides` قراءة للجميع، والكتابة من الخادم فقط (يجب نشر القواعد).
- حد 12 دالة على Vercel: الإجراءات (`ready-add`، `ready-remove`) داخل `api/admin.ts`.

## الخطوة 2 كما نُفذت
- `npm run ready-to-gallery` يكتب `src/data/galleryReady/ready.json`: 167 شريحة (كل الفئات عدا الثابتة)، كل واحدة بمعرّفات عناصرها وتصنيف المعرض الأقرب لفئتها (مدخل←واجهة، عرض خاص←عروض، قائمة أسعار/مميزات/جدول/خدماتنا←خدمات وأسعار، آخر مشاريعنا/معرض صور←معرض صور، قوانين←شروط، شركاؤنا/فيديو←أخرى، عنوان وخرائط←تواصل، من نحن/نبذة←من نحن).
- في مراجعة الشرائح صندوق «الشرائح الجاهزة في المعرض»: «نسخ الشرائح الجاهزة إلى المعرض» (على دفعات من 30)، «إعادة نسخ غير المعدّل»، «نشر الكل مباشرة». تُكتب باسم «Weelink AI» وبحالة «بانتظار المراجعة» ومعها `seededFrom` (الفئة والمكان الأصليان).
- لوحة المحرر لا تتغير: لا تُنشأ وثائق `readySlides` ولا تتكرر الشرائح عند القبول.
- تنبيه: المعرض يقرأ أول 60 شريحة مقبولة (`GALLERY_LIMIT`)؛ نشر 167 شريحة رسمية دفعة واحدة سيزاحم تصاميم المصممين. الأفضل نشر ما تختاره الإدارة فقط (الخطوة 3).


## Step 3 — admin tool (done)
- Admin view «الشرائح الجاهزة» (`ReadySlidesView`): per category, slides in order with أعلى/أسفل, move to another category, take out; «اعتماد الشرائح المنسوخة» places approved copied slides in their original category and order.
- Per-category switch «استعمل شرائح المعرض بدل شرائح الكود» (`readyConfig/{category}.useGallery`); refused when the category has no approved slide. The editor hides the code's slides for a switched category only while it has gallery slides to show.
- Server: `moveReady`, `adoptSeeded`, `setUseGallery`, `readyOverview` in `server/readySlides.ts`; actions `ready-overview|move|adopt|use-gallery`. Needs the new `readyConfig` rule published.

## Step 4 — new «ابن صفحتي»: fixed models, random slides, AI writes text only (plan, Eyad 21 Oct)
Principle: the free page is the base that every page has; each other type (مطعم، سيارات، متجر، برو) is the base + its own intro + its own section. The AI only writes texts and image searches; the server picks the slides.

### Models (النماذج): the sections of a page, in order
- **الأساس (حرة)**: مدخل ← من نحن ← خدمات ← [أسعار: إن ذكر خدمات بأسعار] ← [معرض: إن رفع صوراً] ← تواصل ← قوانين وخصوصية. Optional, owner ticks them before the build: لماذا نحن، أرقام، مواعيد، فريق.
- **مطعم / متجر / سيارات**: مدخل خاص بالنوع ← قسم النوع (المنيو / المنتجات / السيارات: من الكود، يقرأ بيانات حية) ← من نحن ← [معرض] ← تواصل ← خصوصية.
- **برو**: the same model of its type + more optional sections (فريق، شركاء، آخر مشاريعنا، فيديو) and more slides per page.
- Every model starts with an intro slide.

### What a section holds (احتواء الشرائح)
A section = { ready category, required?, condition, how many slides (1 by default) }. Slides come from `readySlides` of that category when the category is switched to the gallery, or from the code for the fixed categories.
A slide is eligible only if: approved, in the ready list, switched on, its text slots are marked (aiSlot with a character limit), and it is not already used in this page.
Pick: random among the eligible, weighted by likes and uses, never the same slide as the owner's previous build. The page style (lookSlide) is applied after the pick.

### What the AI does
Gets the owner's card + the chosen slides' slots (name, character limit, how many items) and returns the texts, plus one English image search per image slot, derived from the service next to it. The owner's own photos come first; the search is the fallback; a default photo of the category if the search fails. Today's checks stay (limits, no invented prices, no links, no emoji).

### After the build
The ready-slide panel stays for adding any slide, and booking stays an option. A button «املأها من بطاقتي» asks the AI for the texts of that one slide only.

### Phases
4a. Models as data (`pageModels/{type}`, defaults in code) + an admin tab to edit them.
4b. Slot marking tool in the admin + the eligibility rule.
4c. New server build: picks the slides, AI text-only prompt, images by service; tests.
4d. «املأها من بطاقتي».
4e. Remove the old catalog (`ai-catalog`, buildCatalog.json) once the new build is live.

### Decisions (Eyad, 21 Oct) — final for step 4
- Page types (14): تعريفية مجانية / برو؛ مطعم، متجر، سيارات × (مجاني، 30، 60، برو).
- Free restaurant / shop / cars: the base page + the type's own intro and look + a **manual price list** (name and price rows the user edits by hand; no online order, no photo per item, not in search, no item numbers; no limit on rows). New plan ids with price 0.
- 30 / 60 / برو differ only by the limits (items, devices, photos, builds); Pro adds optional sections. Adding pages, slides or elements stays free; limiting additions by package (with an upgrade message) is a **later step**.
- Free page photos: 7 = logo + intro background + 5 in the gallery (already `gallery: 5`).
- Ratings slide: added only after the owner answers «نعم» to the new Wee AI question about the ratings system; the user can add it later from the editor.
- Legal / privacy slide: added automatically, the user may delete it (no longer required).

### Checked in the code
- The existing `prices` ready slides are package tiers (pricing elements), **not** a row price list. A new «قائمة أسعار» slide/element with editable rows is needed (4a).
- «خدماتي» in the page admin has item numbers, prices and pictures: the free types must not use it for their price list.

### Questions (Wee AI) — changes (Eyad, 21 Oct)
Today (src/components/WeeAIChat.tsx): 1 owner · 2 address · 3 contact · 4 category · 5 description · 6 colour · 7 divider style · 8 gallery photos (up to 5) · 9 logo · 10 intro background · 11 effects · 12 notes.
- **Photo steps stay** (8 gallery, 9 logo, 10 intro background) — Eyad changed his mind, 21 Oct. Where an answer has no photo, the image search by service fills the slot.
- **Prepare for paid galleries of up to 15 photos** (a later step turns it on; `planLimits.ts` already has gallery 5 / 15): the limit is read from the project's package, not written as 5 in the code. Places that hold the 5 today: step 8 of `WeeAIChat.tsx` (`>= 5`, texts), `galleryOf` in `pageBuilder.ts` (`slice(0, 5)`), `cleanAssets` in `api/build-page.ts` (`Math.min(5, …)`). The gallery ready slides must lay out any count from 1 to 15 (grid that grows, or a second gallery slide past a size).
- **Remove** step 7 (divider style) and 11 (effects) only if the user says so; not touched here.
- **Add** three choice steps, each a set of tick boxes:
  1. **صفحات اختيارية** (the owner marks the pages he wants; e.g. حجز، تقييمات، معرض أعمال، فريق، الأسئلة الشائعة): each becomes a page in the model after the base ones. Per package: the list offered is the type's own.
  2. **شرائح اختيارية**: slides the owner marks inside the pages: حجز مواعيد، التقييمات (also switches the ratings system on), القوانين والخصوصية (ticked by default, he may untick), لماذا نحن، أرقام، فريق.
  3. (Free restaurant / shop / cars) his price-list items, typed as name and price, or skipped to fill in the editor.
- Questions are data (`wizardSteps`) read by the chat and by the model editor, so the admin can later add, remove or reorder them without code. The answers each tick maps to a model section (`when: answers.optionalSlides includes 'ratings'`).
- Old saved answers (photo fields, 12-step numbering) keep loading: the steps are re-numbered by id, not by position.

### Free restaurant / shop / showroom — wiring (done in the free-models step)
- `PLANS.restaurant|shop|cars` start with `{kind}-free` (price 0). `flavorOf(planId)` says which type a free plan flavours.
- Picking one starts the questions as a **page** (project key, answers, build and limits are a page's) with `flavor` on the answers; the questions use the type's words (`flavor` prop of `WeeAIChat`). The page asks «خدماتك وأسعارها» as before, which becomes the price list.
- The free quota is the account's one free project (`freeTaken` now counts any free flavour against `owned.includes('page')`).
- Not yet: the builder reading `flavor` (4c) and the price-list slide itself.

### Step 4b — slot marking and eligibility (done)
- `src/data/aiSlots.ts` holds the slot rules (`describe`, limits, names) that `scripts/build-ai-catalog.ts` used to hold; the script imports them (its output is unchanged by the move). `slideEligibility(elements)`: a title or text to write, known slot names used once, lists counted from 0 without gaps.
- `server/slotMarks.ts` + action `slots-mark`: the admin marks `aiSlot` on a gallery slide's elements; the slide itself is not touched (an `aiTemplate` on it would make the page looks restyle it as one of the code's designs).
- The «الشرائح الجاهزة» admin screen shows «جاهزة للتوليد · N خانات» or what is missing, and a «الخانات» panel per slide.
- The committed `buildCatalog.json` is behind the templates (regenerating it adds 361 lines); regenerate it with `npm run ai-catalog` when step 4c lands.
- Still to do in 4c: the gallery-count rule (1–15 photos) and the picker that reads `eligible` slides.

### Step 4c — the new build (done for page projects)
- `server/pagePicker.ts`: from the project's model (`modelOf(plan)`, admin-edited `pageModels` over the defaults) and what the owner gave (services, prices, photos, ticked sections), the server fixes the sections and picks one slide for each at random: the code's templates of that section and the gallery slides marked for the AI (`readySlides` + `slotStatus`), a switched category using gallery slides only while one works. The slide of the owner's last build is left for last (`platform_build_picks`).
- `api/build-page.ts`: with a pick, the prompt lists only the chosen sections and the AI writes their texts, photo searches, icons, tones and entrance; `checkPlan(…, over)` keeps the chosen sections, order and slides whatever the AI answered. The response carries the gallery slides used (`extra`). No pick (paid restaurant, shop and showroom, no database, no sections) = the old AI planning, unchanged.
- Browser: `buildPageFromPlan` builds a `g:{id}` section from its payload like any ready slide; `requestPagePlan` sends the answers' `flavor`; `WeeAIChat` keeps the flavour with the saved answers.
- Not yet: the questions for optional pages and slides (`ticked` is accepted by the server but nothing sends it, so «يختاره الزبون» sections use their default), the 1–15 photo gallery layout, price list slide, paid restaurant/shop/showroom on models.
- Cloudflare: the worker serves the same `api/*.ts` handlers, so nothing new to register; the 12-function limit no longer binds.

### Step 4d — optional sections in the questions, and the ratings decision (done)
- Step 12 of Wee AI's questions now starts with tick boxes (`src/data/optionalSections.ts`: لماذا نحن، التقييمات، الشروط والخصوصية; privacy ticked from the start). The ticked ids are saved with the answers (`aiAnswers.optionalSections`; nothing saved = the defaults) and sent to `/api/build-page` as `ticked`. Only the sections the builder can make today are offered; the others (team, video, projects, partners, booking) join when the admin has slides marked for them.
- Ratings: the browser builder adds the «التقييمات» slide (title + ratings box, in the page's colours) before the contact and terms when ticked. The page project no longer adds it by itself and the free page no longer locks it (Eyad, 21 Oct: added after a «نعم», removable, or added from the editor). Paid restaurant, shop and showroom keep their suggest-once behaviour.
- Not yet: optional *pages* (a page project builds one page), the 1–15 photo gallery layout, the price list slide, paid kinds on models.

### Contact methods in the build (checked 21 Oct)
- The questions collect WhatsApp, phone, address, Facebook and TikTok. The builder already used the first three (the contact slides' system slots, dropped when empty); **Facebook and TikTok were never shown**. Now the contact section gets one button each (`contactType` facebook / tiktok, the platform's own contact link) under the slide's content, with the slide and its phone layout made taller to hold them. A value that is not a Facebook / TikTok address is ignored.
- Working hours are not asked, so the `hours` slots are always dropped.

### The gallery's photo viewer (21 Oct)
- The viewer the older gallery pages used is the editor's `gallery` block (main photo + thumbnails; a click opens the full-screen viewer with next / previous, arrow keys and thumbnails). The AI-built gallery sections used loose `image` frames, so it was gone from new pages.
- `lightboxGroup` on an image element (types.ts): in the preview and on the published page a click opens that viewer on every image of the slide with the same group, in reading order (`src/utils/imageGroup.ts`). The builder gives the photo frames of every `gallery` section the group `photos` (code templates and gallery slides alike); the editor's image panel has a «تكبير عند النقر» tick for any image.
- New AI-only template `gallery.viewer` (the gallery block itself, filled with the owner's photos, dropped when there are none); it is not in the editor's ready-slide panel so the keys of the slides copied to the gallery do not move. `catalog` regenerated.
- Still to do: the photo count from the package (5 / 15) in `galleryOf`, the question and `cleanAssets`.

### Galleries of 5 and 15 photos (done, 21 Oct)
- The editor's «معرض صور» ready category has two viewer slides first: «معرض صور (حتى 5)» (`gallery.viewer`, the block's own main photo + five thumbnails) and «معرض صور (حتى 15)» (`gallery.viewer15`, the thumbnails move sideways in a strip past five photos; the viewer has them all). Both are in the AI catalog.
- `gallery` is now a **fixed** ready category (code only) like the shop, menu, booking and contact: no gallery slide can be added to it, the admin screen and the copy to the gallery skip it (154 slides now), the editor and the page picker ignore any gallery slide that was added to it, and its switch is ignored. The 13 gallery slides copied earlier stay in the gallery as ordinary designs.
- Photo counts come from the package: the question (`galleryMax`: 5 on the free page, 15 on Pro; 15 while paying is off), the browser builder (`maxPhotos` from the open project's limits), and the server (clamped to the plan's gallery when billing is on, `GALLERY_MAX` 15 otherwise). The picker gives a gallery section only a slide that holds all the photos (frames hold 5, so past five photos it is the 15 viewer).
- Limiting what a package may add (slides, pages) with the upgrade message is still the later step.
