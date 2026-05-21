# DPA For Teachers And Schools Outline

Status: draft outline
Date: 2026-05-20

Purpose: standalone processor agreement required when the MTU operates RedPen
for a school/controller under GDPR Article 28.

## 1. Parties

- Controller: school, school owner, or other education institution using RedPen.
- Processor: MTU administering the hosted RedPen service.
- Authorized users: teachers, school admins, students, MTU support staff.

## 2. Subject Matter And Duration

- Subject matter: AI-assisted transcription, task analysis, feedback drafting,
  annotation, teacher review, sharing, and audit logging for mathematics tests.
- Duration: from school onboarding until termination plus documented retention
  and deletion periods.

## 3. Nature And Purpose Of Processing

- Account provisioning and role management.
- Upload and storage of grading instructions and student work images.
- OCR, task segmentation, AI-assisted draft feedback and annotation generation.
- Teacher review, edits, confirmation, sharing, optional grade export mock.
- Student viewing of shared feedback.
- Security, audit, support, billing/usage if applicable, and legal compliance.

## 4. Data Categories

- Teacher/school admin account data.
- Student account data and class membership.
- Student work images, detected names, task crops, transcriptions.
- AI draft feedback, confirmed teacher feedback, points, optional grade.
- Audit logs, access logs, AI attempt metadata, file hashes.
- Support communications if the school requests help.

## 5. Categories Of Data Subjects

- Teachers.
- Students aged 13+.
- School admins/DPO contacts.
- MTU platform admins/support staff.

## 6. Processor Obligations

- Process only on documented controller instructions.
- Ensure confidentiality of authorized personnel.
- Apply documented security measures.
- Use only approved sub-processors and keep a sub-processor register.
- Assist controller with data subject rights, DPIA, security, breach response,
  deletion, and audit requests.
- Delete or return personal data at termination, subject to legal retention.
- Make audit and compliance information available to the controller.

## 7. Security Measures

- EU-region Convex deployment and EU-configured AI provider.
- Role-based access control in Convex functions.
- Strong authentication and session management.
- Encryption in transit and provider encryption at rest.
- Signed or authenticated file access only.
- Short retention for raw uploads/crops.
- Audit logging of admin access, AI attempts, teacher decisions, sharing, and
  deletion.
- No real student data in the public repository.
- Secrets held in environment/provider secret stores, never in code.

## 8. AI-Specific Terms

- AI output is a draft and cannot be published without teacher confirmation.
- Provider-side training on school content is disabled.
- Production model calls use documented EU deployment settings.
- The processor maintains model/prompt version logs and benchmark summaries.
- The controller receives meaningful information for notices and school policy.

## 9. Sub-Processors

Reference: [subprocessor-register-outline.md](subprocessor-register-outline.md)

Minimum entries before production:

- Convex: database, functions, file storage.
- Microsoft Azure OpenAI / Foundry Models: AI inference.
- Hosting provider: frontend and upload proxy if applicable.
- Email provider: authentication/notifications if enabled.
- Error monitoring/analytics provider: only if enabled and documented.

## 10. International Transfers

- Production configuration targets EU processing and storage.
- Any residual transfers must be listed in the sub-processor register with legal
  transfer mechanism and safeguards.
- Global AI deployment types are prohibited for student content.

## 11. Breach Notification

- Processor notifies controller without undue delay after becoming aware of a
  personal data breach.
- Notice includes nature of incident, affected categories, likely consequences,
  mitigation, and contact point.

## 12. Termination And Deletion

- Controller can request export and deletion.
- Processor deletes raw images/crops according to retention policy and confirms
  deletion status.
- Audit logs may be retained for a defined period for accountability.

## Sources

- GDPR Article 28 and related obligations:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
