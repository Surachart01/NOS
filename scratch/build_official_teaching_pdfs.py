from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

import build_official_teaching_documents as source


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
LOGO = ROOT / "output" / "college-logo-npvc.png"

FONT_REGULAR = "/System/Library/Fonts/Supplemental/Tahoma.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Tahoma Bold.ttf"
FONT = "NPVC-Tahoma"
FONT_BOLD_NAME = "NPVC-Tahoma-Bold"

BLUE = colors.HexColor("#1F4E79")
BLUE_LIGHT = colors.HexColor("#D9E7F5")
BLUE_PALE = colors.HexColor("#EEF4FA")
GRID = colors.HexColor("#9FB6CE")
GRAY = colors.HexColor("#F2F2F2")
TEXT_GRAY = colors.HexColor("#4D4D4D")


pdfmetrics.registerFont(TTFont(FONT, FONT_REGULAR))
pdfmetrics.registerFont(TTFont(FONT_BOLD_NAME, FONT_BOLD))
pdfmetrics.registerFontFamily(
    FONT,
    normal=FONT,
    bold=FONT_BOLD_NAME,
    italic=FONT,
    boldItalic=FONT_BOLD_NAME,
)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="ThaiBody",
        fontName=FONT,
        fontSize=8.4,
        leading=11.2,
        textColor=colors.black,
        wordWrap="CJK",
        spaceAfter=0,
    )
)
styles.add(
    ParagraphStyle(
        name="ThaiSmall",
        parent=styles["ThaiBody"],
        fontSize=7.2,
        leading=9.2,
    )
)
styles.add(
    ParagraphStyle(
        name="ThaiTiny",
        parent=styles["ThaiBody"],
        fontSize=6.2,
        leading=8.0,
    )
)
styles.add(
    ParagraphStyle(
        name="ThaiCenter",
        parent=styles["ThaiBody"],
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="ThaiCenterSmall",
        parent=styles["ThaiSmall"],
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="ThaiCenterTiny",
        parent=styles["ThaiTiny"],
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="ThaiRight",
        parent=styles["ThaiBody"],
        alignment=TA_RIGHT,
    )
)
styles.add(
    ParagraphStyle(
        name="DocTitle",
        fontName=FONT_BOLD_NAME,
        fontSize=15,
        leading=18,
        alignment=TA_CENTER,
        textColor=BLUE,
        wordWrap="CJK",
    )
)
styles.add(
    ParagraphStyle(
        name="DocSubtitle",
        fontName=FONT,
        fontSize=8.5,
        leading=11,
        alignment=TA_CENTER,
        textColor=TEXT_GRAY,
        wordWrap="CJK",
    )
)
styles.add(
    ParagraphStyle(
        name="SectionTitle",
        fontName=FONT_BOLD_NAME,
        fontSize=10,
        leading=13,
        textColor=BLUE,
        wordWrap="CJK",
        spaceBefore=2,
        spaceAfter=4,
    )
)


def para(text, style="ThaiBody", bold=False, align=None):
    value = escape(str(text)).replace("\n", "<br/>")
    if bold:
        value = f"<b>{value}</b>"
    base = styles[style]
    if align is None:
        return Paragraph(value, base)
    return Paragraph(value, ParagraphStyle(f"{style}-{align}", parent=base, alignment=align))


def page_footer(canvas, doc, label, page_size):
    width, _ = page_size
    canvas.saveState()
    canvas.setStrokeColor(GRID)
    canvas.setLineWidth(0.45)
    canvas.line(doc.leftMargin, 10.5 * mm, width - doc.rightMargin, 10.5 * mm)
    canvas.setFillColor(TEXT_GRAY)
    canvas.setFont(FONT, 6.8)
    canvas.drawString(doc.leftMargin, 6.5 * mm, f"{source.COURSE_CODE} {source.COURSE_NAME}")
    canvas.drawRightString(width - doc.rightMargin, 6.5 * mm, f"{label}  |  หน้า {doc.page}")
    canvas.restoreState()


def later_page_header(canvas, doc, label, page_size):
    width, height = page_size
    page_footer(canvas, doc, label, page_size)
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.setFont(FONT_BOLD_NAME, 7.5)
    canvas.drawString(doc.leftMargin, height - 8.5 * mm, label)
    canvas.setFillColor(TEXT_GRAY)
    canvas.setFont(FONT, 6.7)
    canvas.drawRightString(
        width - doc.rightMargin,
        height - 8.5 * mm,
        f"ภาคเรียนที่ 1 ปีการศึกษา 2569 | 15 สัปดาห์",
    )
    canvas.restoreState()


def first_page_header(story, title, subtitle, logo_width=17 * mm):
    story.append(Image(str(LOGO), width=logo_width, height=logo_width))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(title, styles["DocTitle"]))
    story.append(Spacer(1, 0.8 * mm))
    story.append(Paragraph(subtitle, styles["DocSubtitle"]))
    story.append(Spacer(1, 4 * mm))


def metadata_table(total_width, compact=False):
    body_style = "ThaiSmall" if compact else "ThaiBody"
    rows = [
        [
            para("รหัสวิชา", body_style, True),
            para(source.COURSE_CODE, body_style),
            para("ภาคเรียน", body_style, True),
            para("ภาคเรียนที่ 1 ปีการศึกษา 2569", body_style),
        ],
        [
            para("ชื่อวิชา", body_style, True),
            para(f"{source.COURSE_NAME} ({source.COURSE_NAME_EN})", body_style),
            para("ระดับชั้น", body_style, True),
            para("ประกาศนียบัตรวิชาชีพชั้นสูง ชั้นปีที่ 1 (ปวส.1)", body_style),
        ],
        [
            para("หน่วยกิต", body_style, True),
            para("1-4-3", body_style),
            para("เวลาเรียน", body_style, True),
            para("5 ชั่วโมง/สัปดาห์ รวม 75 ชั่วโมง", body_style),
        ],
        [
            para("ผู้สอน", body_style, True),
            para("นายสุรชาติ ลิ้มรัตนพันธ์", body_style),
            para("สถานศึกษา", body_style, True),
            para("วิทยาลัยอาชีวศึกษานครปฐม", body_style),
        ],
    ]
    widths = [total_width * 0.12, total_width * 0.40, total_width * 0.12, total_width * 0.36]
    table = Table(rows, colWidths=widths, hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.45, GRID),
                ("BACKGROUND", (0, 0), (0, -1), BLUE_LIGHT),
                ("BACKGROUND", (2, 0), (2, -1), BLUE_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3 if compact else 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 if compact else 4),
            ]
        )
    )
    return table


def description_box(total_width, compact=False):
    style = "ThaiSmall" if compact else "ThaiBody"
    data = [
        [para("คำอธิบายรายวิชา (อ้างอิงหลักสูตร)", style, True)],
        [para(source.COURSE_DESCRIPTION, style)],
    ]
    table = Table(data, colWidths=[total_width])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE_LIGHT),
                ("BACKGROUND", (0, 1), (-1, -1), GRAY),
                ("BOX", (0, 0), (-1, -1), 0.45, GRID),
                ("LINEBELOW", (0, 0), (-1, 0), 0.45, GRID),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return table


def build_course_project():
    path = OUT / f"โครงการสอน_{source.COURSE_CODE}_ภาคเรียน1_2569.pdf"
    width, height = A4
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=15 * mm,
        title=f"โครงการสอน {source.COURSE_CODE} {source.COURSE_NAME}",
        author="นายสุรชาติ ลิ้มรัตนพันธ์",
        subject="ภาคเรียนที่ 1 ปีการศึกษา 2569",
    )
    usable = width - doc.leftMargin - doc.rightMargin
    story = []
    first_page_header(
        story,
        "โครงการสอน/แผนการจัดการเรียนรู้ตลอดภาคเรียน",
        "วิทยาลัยอาชีวศึกษานครปฐม | ภาคเรียนที่ 1 ปีการศึกษา 2569",
    )
    story.append(metadata_table(usable))
    story.append(Spacer(1, 3 * mm))
    story.append(description_box(usable))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("โครงการจัดการเรียนรู้ 15 สัปดาห์", styles["SectionTitle"]))

    headers = ["สัปดาห์ที่", "หน่วยที่", "หัวข้อและสาระสำคัญ", "เวลา (ชม.)", "คะแนน"]
    rows = [[para(item, "ThaiCenterSmall", True) for item in headers]]
    for item in source.SCHEDULE:
        topic_lines = "<br/>".join(
            f"{idx}. {escape(topic)}" for idx, topic in enumerate(item["topics"], start=1)
        )
        topic = Paragraph(f"<b>{escape(item['title'])}</b><br/>{topic_lines}", styles["ThaiSmall"])
        rows.append(
            [
                para(item["week"], "ThaiCenterSmall"),
                para(item["unit"], "ThaiCenterSmall"),
                topic,
                para(item["hours"], "ThaiCenterSmall"),
                para(item["score"], "ThaiCenterSmall"),
            ]
        )
    rows.append(
        [
            para("รวมจำนวนชั่วโมงและคะแนนตลอดภาคเรียน", "ThaiRight", True),
            "",
            "",
            para(sum(item["hours"] for item in source.SCHEDULE), "ThaiCenter", True),
            para(sum(item["score"] for item in source.SCHEDULE), "ThaiCenter", True),
        ]
    )
    schedule = LongTable(
        rows,
        colWidths=[14 * mm, 14 * mm, 122 * mm, 16 * mm, 16 * mm],
        repeatRows=1,
        hAlign="CENTER",
    )
    schedule.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -2), 0.45, GRID),
                ("BACKGROUND", (0, 0), (-1, 0), BLUE_LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), BLUE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("SPAN", (0, -1), (2, -1)),
                ("BACKGROUND", (0, -1), (-1, -1), BLUE_PALE),
                ("BOX", (0, -1), (-1, -1), 0.6, GRID),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(schedule)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("สัดส่วนการประเมินผล", styles["SectionTitle"]))
    score_headers = ["คะแนนเก็บ/ใบงาน", "Project", "สอบปฏิบัติ", "จิตพิสัย", "สอบปลายภาค"]
    score_values = [35, 15, 10, 20, 20]
    score_table = Table(
        [
            [para(v, "ThaiCenterSmall", True) for v in score_headers],
            [para(f"{v} คะแนน", "ThaiCenterSmall", True) for v in score_values],
        ],
        colWidths=[usable / 5] * 5,
    )
    score_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.45, GRID),
                ("BACKGROUND", (0, 0), (-1, 0), BLUE_LIGHT),
                ("BACKGROUND", (0, 1), (-1, 1), GRAY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(score_table)
    story.append(Spacer(1, 2 * mm))
    story.append(para("รวมทั้งสิ้น 100 คะแนน", "ThaiRight", True))
    story.append(Spacer(1, 8 * mm))
    signature = Table(
        [
            [para("ลงชื่อ ........................................................ ผู้สอน", "ThaiCenterSmall"), para("ลงชื่อ ........................................................ หัวหน้าแผนกวิชา", "ThaiCenterSmall")],
            [para("(นายสุรชาติ ลิ้มรัตนพันธ์)", "ThaiCenterSmall"), para("(........................................................)", "ThaiCenterSmall")],
            [para("วันที่ ........../........../..........", "ThaiCenterSmall"), para("วันที่ ........../........../..........", "ThaiCenterSmall")],
        ],
        colWidths=[usable / 2] * 2,
    )
    signature.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    story.append(signature)

    label = "โครงการสอน"
    doc.build(
        story,
        onFirstPage=lambda c, d: page_footer(c, d, label, A4),
        onLaterPages=lambda c, d: later_page_header(c, d, label, A4),
    )
    return path


def build_learning_analysis():
    page_size = landscape(A4)
    width, _ = page_size
    path = OUT / f"ตารางวิเคราะห์การจัดการเรียนรู้_{source.COURSE_CODE}_ภาคเรียน1_2569.pdf"
    doc = SimpleDocTemplate(
        str(path),
        pagesize=page_size,
        leftMargin=8 * mm,
        rightMargin=8 * mm,
        topMargin=13 * mm,
        bottomMargin=14 * mm,
        title=f"ตารางวิเคราะห์การจัดการเรียนรู้ {source.COURSE_CODE}",
        author="นายสุรชาติ ลิ้มรัตนพันธ์",
        subject="ภาคเรียนที่ 1 ปีการศึกษา 2569",
    )
    usable = width - doc.leftMargin - doc.rightMargin
    story = []
    first_page_header(
        story,
        "ตารางวิเคราะห์การจัดการเรียนรู้",
        "รายวิชา 31901-2002 ระบบปฏิบัติการเครื่องแม่ข่าย | ปวส.1 | ภาคเรียนที่ 1 ปีการศึกษา 2569",
        14 * mm,
    )
    story.append(metadata_table(usable, compact=True))
    story.append(Spacer(1, 2.5 * mm))
    story.append(description_box(usable, compact=True))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("การเชื่อมโยงหน่วยการเรียนรู้กับสมรรถนะและการประเมิน", styles["SectionTitle"]))

    headers = [
        "หน่วยที่",
        "ชื่อหน่วย",
        "สมรรถนะวิชาชีพ",
        "จุดประสงค์รายวิชา",
        "เนื้อหาสาระ (โดยย่อ)",
        "กิจกรรมการเรียนรู้",
        "สื่อการเรียนรู้",
        "วิธีการประเมิน",
        "เวลา (ชม.)",
    ]
    rows = [[para(item, "ThaiCenterTiny", True) for item in headers]]
    for item in source.ANALYSIS:
        rows.append(
            [
                para(item["unit"], "ThaiCenterTiny", True),
                para(item["name"], "ThaiTiny", True),
                para(item["competency"], "ThaiTiny"),
                para(item["objective"], "ThaiCenterTiny"),
                para(item["content"], "ThaiTiny"),
                para(item["activity"], "ThaiTiny"),
                para(item["media"], "ThaiTiny"),
                para(item["assessment"], "ThaiTiny"),
                para(item["hours"], "ThaiCenterTiny"),
            ]
        )
    rows.append(
        [
            para("รวมเวลาเรียนตลอดภาคเรียน", "ThaiRight", True),
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            para(sum(item["hours"] for item in source.ANALYSIS), "ThaiCenter", True),
        ]
    )
    widths = [10, 30, 40, 32, 46, 46, 29, 34, 14]
    analysis = LongTable(
        rows,
        colWidths=[value * mm for value in widths],
        repeatRows=1,
        hAlign="CENTER",
    )
    analysis.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -2), 0.4, GRID),
                ("BACKGROUND", (0, 0), (-1, 0), BLUE_LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), BLUE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("SPAN", (0, -1), (7, -1)),
                ("BACKGROUND", (0, -1), (-1, -1), BLUE_PALE),
                ("BOX", (0, -1), (-1, -1), 0.55, GRID),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(analysis)
    story.append(Spacer(1, 3 * mm))
    story.append(
        para(
            "หมายเหตุ: สมรรถนะวิชาชีพเชื่อมโยงกับมาตรฐานอาชีพ รหัส 40106 "
            "ช่างสนับสนุนด้านเทคนิค ระดับ 5 และผลลัพธ์การเรียนรู้ระดับรายวิชา",
            "ThaiSmall",
        )
    )

    label = "ตารางวิเคราะห์การจัดการเรียนรู้"
    doc.build(
        story,
        onFirstPage=lambda c, d: page_footer(c, d, label, page_size),
        onLaterPages=lambda c, d: later_page_header(c, d, label, page_size),
    )
    return path


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    print(build_course_project())
    print(build_learning_analysis())
