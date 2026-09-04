Pocket 64 v4.2.3 — WORKING SET EDIT

FIXED
- Keeps the clean single ••• Set menu.
- ••• contains EDIT SET and DELETE SET.
- EDIT SET now actually opens.
- Root cause fixed: editOpenSet() referenced a missing escapeHtml() helper.
- Set Name and Cars in Set can be changed and saved.
- Existing assignments stay intact unless you shrink below occupied positions.
- Cars/photos are never deleted by changing the Set size.
- Version display is patched to 4.2.3 in both app code and page HTML.

INSTALL
Replace the existing sw.js with this sw.js.

AFTER UPLOAD
Fully close Pocket 64, reopen it, then open a Set:
••• > EDIT SET

You should get the edit form immediately.
