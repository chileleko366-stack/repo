"""
Session 9 — Review dashboard generator.
Reads drafts/registry.json and generates drafts/dashboard.html — a static page
listing every pending draft with thumbnail, title, script summary, and asset misses.
Approve and reject buttons call publish.py via POST form actions.
"""

import json
import base64
from pathlib import Path

REGISTRY = Path("drafts/registry.json")
OUTPUT = Path("drafts/dashboard.html")


def _load_registry() -> list:
    if not REGISTRY.exists():
        return []
    with open(REGISTRY) as f:
        return json.load(f)


def _thumb_b64(path: str | None) -> str:
    if not path or not Path(path).exists():
        return ""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def generate_dashboard() -> None:
    drafts = _load_registry()
    pending = [d for d in drafts if d["status"] == "pending_review"]
    all_items = sorted(drafts, key=lambda d: d.get("uploaded_at", ""), reverse=True)

    status_color = {
        "pending_review": "#f59e0b",
        "approved": "#10b981",
        "scheduled": "#3b82f6",
        "published": "#6366f1",
        "rejected": "#ef4444",
    }

    cards_html = ""
    for d in all_items:
        thumb_b64 = _thumb_b64(d.get("thumbnail_path"))
        thumb_html = (
            f'<img src="data:image/jpeg;base64,{thumb_b64}" style="width:100%;border-radius:8px;display:block;">'
            if thumb_b64
            else '<div style="width:100%;height:140px;background:#222;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;">No thumbnail</div>'
        )

        misses = d.get("asset_misses", [])
        miss_html = (
            "<div style='color:#f87171;font-size:12px;margin-top:8px;'>"
            + "<br>".join(misses[:5])
            + ("…" if len(misses) > 5 else "")
            + "</div>"
            if misses
            else ""
        )

        status = d.get("status", "unknown")
        sc = status_color.get(status, "#888")
        vid = d["video_id"]
        ch = d.get("channel_id", "")

        approve_form = (
            f"""
            <form method="post" action="/approve" style="display:inline">
              <input type="hidden" name="video_id" value="{vid}">
              <input type="hidden" name="channel_id" value="{ch}">
              <input type="text" name="publish_at" placeholder="ISO datetime or blank for now"
                     style="padding:4px 8px;border-radius:4px;border:1px solid #555;background:#1a1a1a;color:#fff;font-size:12px;width:220px;">
              <button type="submit" style="background:#10b981;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;">Approve</button>
            </form>
            <form method="post" action="/reject" style="display:inline;margin-left:8px">
              <input type="hidden" name="video_id" value="{vid}">
              <input type="hidden" name="channel_id" value="{ch}">
              <input type="text" name="reason" placeholder="Rejection reason"
                     style="padding:4px 8px;border-radius:4px;border:1px solid #555;background:#1a1a1a;color:#fff;font-size:12px;width:180px;">
              <button type="submit" style="background:#ef4444;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;">Reject</button>
            </form>
            """
            if status == "pending_review"
            else ""
        )

        summary = d.get("script_summary", "")[:200]

        cards_html += f"""
        <div style="background:#111;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="display:flex;gap:20px;align-items:flex-start;">
            <div style="width:180px;flex-shrink:0;">{thumb_html}</div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="background:{sc};color:#000;font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;text-transform:uppercase;">{status}</span>
                <span style="color:#888;font-size:12px;">{ch} · {d.get('uploaded_at','')[:16]}</span>
                <a href="https://studio.youtube.com/video/{vid}/edit" target="_blank"
                   style="color:#60a5fa;font-size:12px;text-decoration:none;">YT Studio ↗</a>
              </div>
              <div style="color:#fff;font-size:18px;font-weight:700;margin-bottom:6px;">{d.get('title','')}</div>
              <div style="color:#9ca3af;font-size:14px;line-height:1.5;">{summary}</div>
              {miss_html}
              <div style="margin-top:14px;">{approve_form}</div>
            </div>
          </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dopamine Studios — Draft Review Dashboard</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ background: #0a0a0a; color: #e5e7eb; font-family: 'Segoe UI', system-ui, sans-serif; }}
    .header {{ background: #111; border-bottom: 1px solid #222; padding: 20px 40px; display: flex; align-items: center; justify-content: space-between; }}
    .container {{ max-width: 960px; margin: 32px auto; padding: 0 24px; }}
    .stats {{ display: flex; gap: 24px; margin-bottom: 32px; }}
    .stat {{ background: #111; border: 1px solid #333; border-radius: 8px; padding: 16px 24px; }}
    .stat-n {{ font-size: 32px; font-weight: 700; }}
    .stat-l {{ font-size: 13px; color: #9ca3af; margin-top: 4px; }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:20px;font-weight:700;">Dopamine Studios</div>
      <div style="font-size:13px;color:#9ca3af;">Draft Review Dashboard · {len(all_items)} total videos</div>
    </div>
    <div style="color:#9ca3af;font-size:13px;">Generated {Path(OUTPUT).stat().st_mtime if OUTPUT.exists() else 'now'}</div>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat">
        <div class="stat-n" style="color:#f59e0b;">{sum(1 for d in all_items if d['status']=='pending_review')}</div>
        <div class="stat-l">Pending Review</div>
      </div>
      <div class="stat">
        <div class="stat-n" style="color:#3b82f6;">{sum(1 for d in all_items if d['status']=='scheduled')}</div>
        <div class="stat-l">Scheduled</div>
      </div>
      <div class="stat">
        <div class="stat-n" style="color:#6366f1;">{sum(1 for d in all_items if d['status']=='published')}</div>
        <div class="stat-l">Published</div>
      </div>
      <div class="stat">
        <div class="stat-n" style="color:#ef4444;">{sum(1 for d in all_items if d['status']=='rejected')}</div>
        <div class="stat-l">Rejected</div>
      </div>
    </div>
    {cards_html if all_items else '<div style="color:#9ca3af;text-align:center;padding:60px;">No drafts yet — run the pipeline to generate videos.</div>'}
  </div>
  <script>
    /* Form submissions handled via local Python server or manually calling publish.py CLI */
    document.querySelectorAll('form').forEach(form => {{
      form.addEventListener('submit', (e) => {{
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const action = form.action.split('/').pop();
        const cmd = action === 'approve'
          ? `python src/scripts/publish.py approve --channel ${{data.channel_id}} --video-id ${{data.video_id}}${{data.publish_at ? ' --publish-at ' + data.publish_at : ''}}`
          : `python src/scripts/publish.py reject --channel ${{data.channel_id}} --video-id ${{data.video_id}} --reason "${{data.reason || 'manual rejection'}}"`;
        alert('Run this command:\\n\\n' + cmd);
      }});
    }});
  </script>
</body>
</html>"""

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(html)
    print(f"[dashboard] Generated {OUTPUT} — {len(pending)} pending review")


if __name__ == "__main__":
    generate_dashboard()
