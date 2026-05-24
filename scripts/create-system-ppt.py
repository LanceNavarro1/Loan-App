from datetime import date
from html import escape
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Easy-Loan-System-Presentation.pptx"

SLIDE_W = 13_333_333
SLIDE_H = 7_500_000

COLORS = {
    "navy": "131B2E",
    "green": "006C49",
    "mint": "DCFFF0",
    "blue": "004395",
    "sky": "D8E2FF",
    "bg": "F7F9FB",
    "white": "FFFFFF",
    "text": "191C1E",
    "muted": "45464D",
    "line": "C6C6CD",
}


slides = [
    {
        "title": "Easy Loan System",
        "subtitle": "Web-based loan application and management platform",
        "bullets": [
            "Fast borrower registration, loan application, document verification, payment tracking, and admin review.",
            "Designed for borrowers, administrators, staff, and support teams.",
        ],
        "tag": "System Presentation",
    },
    {
        "title": "Project Overview",
        "subtitle": "Purpose of the system",
        "bullets": [
            "Provides a digital process for applying, reviewing, approving, and monitoring loans.",
            "Improves transparency through loan status pages, payment history, receipts, and notifications.",
            "Centralizes admin operations such as user management, loan plans, reports, security, and settings.",
        ],
    },
    {
        "title": "Main User Modules",
        "subtitle": "Borrower-facing features",
        "bullets": [
            "Account registration, login, OTP verification, password reset, profile editing, and security settings.",
            "Loan application form, loan status, loan details, and loan history.",
            "Document upload and verification status for borrower requirements.",
            "Payment upload, receipts, payment history, notifications, support tickets, FAQ, and live chat pages.",
        ],
    },
    {
        "title": "Admin Modules",
        "subtitle": "Back-office management",
        "bullets": [
            "Admin dashboard with statistics, analytics, activity logs, and operational summaries.",
            "Loan application review with pending, approved, rejected, details, and status management pages.",
            "Borrower verification tools for KYC, valid ID review, income verification, and document checks.",
            "Payment management for confirmations, overdue payments, penalties, receipts, and payment details.",
        ],
    },
    {
        "title": "Staff, Security, and Settings",
        "subtitle": "Control and governance",
        "bullets": [
            "Staff and admin management includes staff lists, roles, permissions, activity, and add/edit workflows.",
            "Security pages include two-factor authentication, login history, backup and restore, and security settings.",
            "System settings cover company profile, general settings, loan settings, payment settings, email, SMS, and theme options.",
        ],
    },
    {
        "title": "Loan Application Flow",
        "subtitle": "Typical borrower journey",
        "bullets": [
            "1. Borrower registers or logs in to the system.",
            "2. Borrower completes profile details and submits loan requirements.",
            "3. Borrower fills out and submits the loan application form.",
            "4. Admin reviews documents, verifies eligibility, and updates the loan status.",
            "5. Borrower receives updates, makes payments, and tracks receipts/history.",
        ],
    },
    {
        "title": "Administrative Workflow",
        "subtitle": "How staff process loans",
        "bullets": [
            "Monitor incoming applications from the admin dashboard.",
            "Review borrower documents, valid IDs, income proof, and KYC information.",
            "Approve or reject loan applications based on requirements and configured loan plans.",
            "Track payments, confirm uploaded proof of payment, and manage overdue accounts or penalties.",
            "Generate borrower, loan, payment, revenue, and monthly statistic reports.",
        ],
    },
    {
        "title": "Key Benefits",
        "subtitle": "Value delivered by the system",
        "bullets": [
            "Reduces manual paperwork and keeps borrower records organized.",
            "Makes the loan process clearer for users through visible statuses and histories.",
            "Supports faster admin review with dedicated pages for each operational task.",
            "Improves accountability with activity logs, reports, security pages, and role management.",
        ],
    },
    {
        "title": "Technology Structure",
        "subtitle": "Project organization",
        "bullets": [
            "Frontend screens are organized into user, admin, settings, templates, and static folders.",
            "Static assets include shared CSS, JavaScript, and the Easy Loan icon.",
            "A Django project structure exists under ezloan with app files for loans, URLs, models, views, and migrations.",
            "Scripts are included for generating groups of admin, user, support, security, notification, staff, and settings pages.",
        ],
    },
    {
        "title": "Conclusion",
        "subtitle": "System summary",
        "bullets": [
            "Easy Loan is a complete loan management interface for both borrowers and administrators.",
            "It covers the full process from application and verification to payment tracking, reporting, support, and security.",
            "The system can be extended with database-backed workflows, authentication, notifications, and report export features.",
        ],
        "tag": f"Prepared {date.today().isoformat()}",
    },
]


def tx(text):
    return escape(str(text), quote=True)


def rels_xml(rels):
    body = "\n".join(
        f'<Relationship Id="{rid}" Type="{typ}" Target="{target}"/>' for rid, typ, target in rels
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
{body}
</Relationships>'''


def text_shape(shape_id, x, y, w, h, text, size=2400, color="text", bold=False):
    weight = ' b="1"' if bold else ""
    return f'''
<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="Text {shape_id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" anchor="t"/>
    <a:lstStyle/>
    <a:p><a:r><a:rPr lang="en-US" sz="{size}"{weight}><a:solidFill><a:srgbClr val="{COLORS[color]}"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr><a:t>{tx(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="{size}"/></a:p>
  </p:txBody>
</p:sp>'''


def rect(shape_id, x, y, w, h, fill, line=None, radius=False):
    geom = "roundRect" if radius else "rect"
    ln = f'<a:ln w="9000"><a:solidFill><a:srgbClr val="{COLORS[line]}"/></a:solidFill></a:ln>' if line else '<a:ln><a:noFill/></a:ln>'
    return f'''
<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="Shape {shape_id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{COLORS[fill]}"/></a:solidFill>{ln}</p:spPr>
</p:sp>'''


def bullet_shape(shape_id, x, y, w, h, bullets):
    paragraphs = []
    for bullet in bullets:
        paragraphs.append(f'''
    <a:p>
      <a:pPr marL="342900" indent="-171450"><a:buChar char="•"/></a:pPr>
      <a:r><a:rPr lang="en-US" sz="2050"><a:solidFill><a:srgbClr val="{COLORS["text"]}"/></a:solidFill><a:latin typeface="Aptos"/></a:rPr><a:t>{tx(bullet)}</a:t></a:r>
      <a:endParaRPr lang="en-US" sz="2050"/>
    </a:p>''')
    return f'''
<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="Bullets {shape_id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
  <p:txBody>
    <a:bodyPr wrap="square" anchor="t"/>
    <a:lstStyle/>
{''.join(paragraphs)}
  </p:txBody>
</p:sp>'''


def slide_xml(index, slide):
    title_y = 900_000
    shapes = [
        rect(2, 0, 0, SLIDE_W, SLIDE_H, "bg"),
        rect(3, 0, 0, 550_000, SLIDE_H, "green"),
        rect(4, 550_000, 0, 95_000, SLIDE_H, "navy"),
        text_shape(5, 1_050_000, title_y, 8_900_000, 650_000, slide["title"], 3900, "navy", True),
        text_shape(6, 1_060_000, 1_610_000, 8_700_000, 430_000, slide["subtitle"], 1850, "green", False),
        rect(7, 1_050_000, 2_280_000, 10_600_000, 3_720_000, "white", "line", True),
        bullet_shape(8, 1_430_000, 2_620_000, 9_820_000, 3_050_000, slide["bullets"]),
        text_shape(9, 11_150_000, 6_870_000, 1_500_000, 240_000, f"{index:02d}", 1450, "muted", True),
    ]
    if slide.get("tag"):
        shapes.append(rect(10, 1_050_000, 520_000, 2_700_000, 330_000, "mint", None, True))
        shapes.append(text_shape(11, 1_260_000, 590_000, 2_300_000, 210_000, slide["tag"], 1050, "green", True))
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {''.join(shapes)}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>'''


def presentation_xml():
    slide_ids = "\n".join(
        f'<p:sldId id="{256 + i}" r:id="rId{2 + i}"/>' for i in range(len(slides))
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>{slide_ids}</p:sldIdLst>
  <p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>'''


def content_types_xml():
    slide_overrides = "\n".join(
        f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(1, len(slides) + 1)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  {slide_overrides}
</Types>'''


SLIDE_MASTER = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>'''

SLIDE_LAYOUT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>'''

THEME = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Easy Loan Theme">
  <a:themeElements>
    <a:clrScheme name="EasyLoan"><a:dk1><a:srgbClr val="191C1E"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="131B2E"/></a:dk2><a:lt2><a:srgbClr val="F7F9FB"/></a:lt2><a:accent1><a:srgbClr val="006C49"/></a:accent1><a:accent2><a:srgbClr val="004395"/></a:accent2><a:accent3><a:srgbClr val="DCFFF0"/></a:accent3><a:accent4><a:srgbClr val="D8E2FF"/></a:accent4><a:accent5><a:srgbClr val="45464D"/></a:accent5><a:accent6><a:srgbClr val="C6C6CD"/></a:accent6><a:hlink><a:srgbClr val="004395"/></a:hlink><a:folHlink><a:srgbClr val="006C49"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="EasyLoan"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>'''


def main():
    presentation_rels = [("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "slideMasters/slideMaster1.xml")]
    presentation_rels.extend(
        (f"rId{2 + i}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", f"slides/slide{i + 1}.xml")
        for i in range(len(slides))
    )

    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types_xml())
        z.writestr("_rels/.rels", rels_xml([
            ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", "ppt/presentation.xml"),
            ("rId2", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"),
            ("rId3", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties", "docProps/app.xml"),
        ]))
        z.writestr("docProps/app.xml", f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Codex</Application><PresentationFormat>On-screen Show (16:9)</PresentationFormat><Slides>{len(slides)}</Slides></Properties>''')
        z.writestr("docProps/core.xml", f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Easy Loan System Presentation</dc:title><dc:creator>Codex</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">{date.today().isoformat()}T00:00:00Z</dcterms:created></cp:coreProperties>''')
        z.writestr("ppt/presentation.xml", presentation_xml())
        z.writestr("ppt/_rels/presentation.xml.rels", rels_xml(presentation_rels))
        z.writestr("ppt/slideMasters/slideMaster1.xml", SLIDE_MASTER)
        z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", rels_xml([
            ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", "../slideLayouts/slideLayout1.xml"),
            ("rId2", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme", "../theme/theme1.xml"),
        ]))
        z.writestr("ppt/slideLayouts/slideLayout1.xml", SLIDE_LAYOUT)
        z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", rels_xml([
            ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "../slideMasters/slideMaster1.xml"),
        ]))
        z.writestr("ppt/theme/theme1.xml", THEME)
        for i, slide in enumerate(slides, 1):
            z.writestr(f"ppt/slides/slide{i}.xml", slide_xml(i, slide))
            z.writestr(f"ppt/slides/_rels/slide{i}.xml.rels", rels_xml([
                ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", "../slideLayouts/slideLayout1.xml")
            ]))

    print(OUT)


if __name__ == "__main__":
    main()
