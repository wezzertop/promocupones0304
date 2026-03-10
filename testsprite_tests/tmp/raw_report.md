
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Promocupones
- **Date:** 2026-03-09
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Home Feed loads with deal cards, filters, and featured sidebar
- **Test Code:** [TC001_Home_Feed_loads_with_deal_cards_filters_and_featured_sidebar.py](./TC001_Home_Feed_loads_with_deal_cards_filters_and_featured_sidebar.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Tab filter 'Tendencias' not found on page
- Section 'Ofertas destacadas' not found on page
- Feed filters do not include 'Más hot' — only 'Para ti', 'Más votadas', and 'Recientes' are present
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/0eb0da4f-3731-4dff-af14-ab3f768d089e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Open a deal from the Home Feed to reach deal details
- **Test Code:** [TC002_Open_a_deal_from_the_Home_Feed_to_reach_deal_details.py](./TC002_Open_a_deal_from_the_Home_Feed_to_reach_deal_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/534e3d92-4255-4098-8333-d0a8f149be3a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Register a new user (happy path up to on-screen confirmation)
- **Test Code:** [TC007_Register_a_new_user_happy_path_up_to_on_screen_confirmation.py](./TC007_Register_a_new_user_happy_path_up_to_on_screen_confirmation.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Registration confirmation message not found after form submission; no 'Check your email' or Spanish equivalent is visible.
- Error banner 'email rate limit exceeded' is displayed above the registration form.
- Submit button entered a loading state but no success UI, navigation, or confirmation appeared.
- Form fields were valid and populated (username, email, password) and the terms checkbox was checked, so client-side validation did not prevent submission.
- Backend/email rate limiting prevented account creation and blocked the expected confirmation state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/cd5d0c22-9cd2-4d8b-9176-2348f330540e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Register fails when email is already registered
- **Test Code:** [TC010_Register_fails_when_email_is_already_registered.py](./TC010_Register_fails_when_email_is_already_registered.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Expected text 'Email already registered' not found on the register page after submitting the registration form.
- Registration attempt was blocked by the error message 'email rate limit exceeded', preventing verification of duplicate-email handling.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/d828a688-0a24-4f9c-b469-ddb5532e88b1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Login fails with incorrect password and shows 'Invalid credentials'
- **Test Code:** [TC011_Login_fails_with_incorrect_password_and_shows_Invalid_credentials.py](./TC011_Login_fails_with_incorrect_password_and_shows_Invalid_credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/1c26f55d-0476-4bb3-b502-620907e1cdba
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Login succeeds with valid credentials and user can access Profile
- **Test Code:** [TC013_Login_succeeds_with_valid_credentials_and_user_can_access_Profile.py](./TC013_Login_succeeds_with_valid_credentials_and_user_can_access_Profile.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/ea179d81-21b6-466c-9f90-479502dbbecf
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 After successful login, user can access Publish page and sees publish UI
- **Test Code:** [TC014_After_successful_login_user_can_access_Publish_page_and_sees_publish_UI.py](./TC014_After_successful_login_user_can_access_Publish_page_and_sees_publish_UI.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/c7f98136-f95d-4993-98d7-c10f43455235
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Publicar una oferta completa con preview en tiempo real y confirmación de éxito
- **Test Code:** [TC015_Publicar_una_oferta_completa_con_preview_en_tiempo_real_y_confirmacin_de_xito.py](./TC015_Publicar_una_oferta_completa_con_preview_en_tiempo_real_y_confirmacin_de_xito.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Live preview did not display the offer title 'Oferta de prueba - envío exitoso' after filling the form.
- Live preview did not display the offer price '19.99' after filling the form.
- No success confirmation 'Publicado' appeared after clicking the Publish button.
- The page remained on /publicar with filled form fields but without any visible success state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/53fb5211-84ec-4604-80ef-a62f1675d25a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Validación: intentar publicar sin título muestra error y permanece en /publicar
- **Test Code:** [TC016_Validacin_intentar_publicar_sin_ttulo_muestra_error_y_permanece_en_publicar.py](./TC016_Validacin_intentar_publicar_sin_ttulo_muestra_error_y_permanece_en_publicar.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/264f1184-fc58-4cbe-bbe8-ef435b661f28
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 Detalle de oferta: votar Hot y comentar exitosamente (usuario autenticado)
- **Test Code:** [TC021_Detalle_de_oferta_votar_Hot_y_comentar_exitosamente_usuario_autenticado.py](./TC021_Detalle_de_oferta_votar_Hot_y_comentar_exitosamente_usuario_autenticado.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/404379bf-a2b8-4b0a-8a73-580241069337
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Detalle de oferta: validar elementos principales visibles
- **Test Code:** [TC022_Detalle_de_oferta_validar_elementos_principales_visibles.py](./TC022_Detalle_de_oferta_validar_elementos_principales_visibles.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/21d80077-9141-43d1-a3d6-3c3b01d6fda6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 Detalle de oferta: votar Hot incrementa contador/estado (usuario autenticado)
- **Test Code:** [TC023_Detalle_de_oferta_votar_Hot_incrementa_contadorestado_usuario_autenticado.py](./TC023_Detalle_de_oferta_votar_Hot_incrementa_contadorestado_usuario_autenticado.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Hot vote count did not change after clicking the 'Hot' vote control; the temperature indicator still shows '0°'.
- No 'Hot' label or confirmation message appeared in the deal detail UI after voting.
- UI screenshot and visible interactive elements indicate no state update occurred following the click.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/c832a656-0b77-4eaf-91ba-26a099de63e5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 Detalle de oferta: comentar con texto vacío muestra error de validación
- **Test Code:** [TC024_Detalle_de_oferta_comentar_con_texto_vaco_muestra_error_de_validacin.py](./TC024_Detalle_de_oferta_comentar_con_texto_vaco_muestra_error_de_validacin.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Submit click targeted the avatar element 'Me' instead of the comment submit button, so the submit action was not triggered.
- No validation message 'Comment cannot be empty' or 'El comentario no puede estar vacío' was found on the page after the submit attempt.
- The login attempt earlier did not complete (login form remained visible and authentication indicator present), which may prevent comment submission or error display.
- The comment submit button was not accessible as a distinct interactive element in the page element list, preventing a reliable programmatic click.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/d5ba5c67-44a6-463b-9ca9-6c0372ed7eb8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Detalle de oferta: publicar comentario válido aparece en la sección de comentarios
- **Test Code:** [TC025_Detalle_de_oferta_publicar_comentario_vlido_aparece_en_la_seccin_de_comentarios.py](./TC025_Detalle_de_oferta_publicar_comentario_vlido_aparece_en_la_seccin_de_comentarios.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/6af1b2ad-3b8d-409f-a3ba-432626dd532c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Search with predictive suggestions and select a suggestion to view filtered results
- **Test Code:** [TC027_Search_with_predictive_suggestions_and_select_a_suggestion_to_view_filtered_results.py](./TC027_Search_with_predictive_suggestions_and_select_a_suggestion_to_view_filtered_results.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/238b821a-ed71-49df-a43e-4122a2665aef/06d4c90a-cd08-4c6b-919b-2898d074b9c7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **60.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---