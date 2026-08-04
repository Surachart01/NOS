from __future__ import annotations

from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Image, Paragraph, Table, TableStyle

from build_template_matched_documents import ANALYSIS_ROWS, PROJECT_ROWS
from fill_course_outline_template import (
    COLLEGE,
    COMPETENCY_LINES,
    COURSE_CODE,
    COURSE_ENGLISH,
    COURSE_NAME,
    COURSEWORK_SCORE,
    CREDITS,
    DESCRIPTION_LINES,
    LEVEL,
    OBJECTIVE_LINES,
    TEACHER,
    TOTAL_HOURS,
    WEEKLY_HOURS,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "เค้าโครงการสอน_31901-2002_ภาคเรียน1_2569.pdf"
LOGO = ROOT / "output" / "college-logo-npvc.png"

FONT_PATH = "/System/Library/Fonts/Supplemental/Tahoma.ttf"
BOLD_PATH = "/System/Library/Fonts/Supplemental/Tahoma Bold.ttf"
PDF_FONT = "Course-Tahoma"
PDF_BOLD = "Course-Tahoma-Bold"

pdfmetrics.registerFont(TTFont(PDF_FONT, FONT_PATH))
pdfmetrics.registerFont(TTFont(PDF_BOLD, BOLD_PATH))
pdfmetrics.registerFontFamily(
    PDF_FONT,
    normal=PDF_FONT,
    bold=PDF_BOLD,
    italic=PDF_FONT,
    boldItalic=PDF_BOLD,
)


def style(name: str, size: float, leading: float, align=TA_LEFT, bold: bool = False) -> ParagraphStyle:
    return ParagraphStyle(
        name,
        fontName=PDF_BOLD if bold else PDF_FONT,
        fontSize=size,
        leading=leading,
        alignment=align,
        textColor=colors.black,
        spaceBefore=0,
        spaceAfter=0,
        splitLongWords=True,
        allowWidows=False,
        allowOrphans=False,
    )


BODY = style("body", 9.0, 12.0)
BODY_CENTER = style("body-center", 9.0, 12.0, TA_CENTER)
BODY_BOLD = style("body-bold", 9.0, 12.0, bold=True)
COVER_ITEM = style("cover-item", 8.8, 11.2)
COVER_DESC = style("cover-desc", 8.5, 11.0)
SCHEDULE_HEADER = style("schedule-header", 8.4, 9.0, TA_CENTER, True)
SCHEDULE_CELL = style("schedule-cell", 7.2, 8.4)
SCHEDULE_CENTER = style("schedule-center", 8.0, 9.0, TA_CENTER)
ANALYSIS_HEADER = style("analysis-header", 6.4, 7.0, TA_CENTER, True)
ANALYSIS_CELL = style("analysis-cell", 5.8, 6.5)
ANALYSIS_CENTER = style("analysis-center", 5.8, 6.5, TA_CENTER)
SIGNATURE = style("signature", 10.0, 14.0, TA_CENTER)
SIGNATURE_BOLD = style("signature-bold", 10.0, 14.0, TA_CENTER, True)


def para(text: object, paragraph_style: ParagraphStyle, bold: bool = False) -> Paragraph:
    value = escape(str(text)).replace("\n", "<br/>")
    if bold:
        value = f"<b>{value}</b>"
    return Paragraph(value, paragraph_style)


def draw_paragraph(pdf: canvas.Canvas, text: str, x: float, top_y: float, width: float, paragraph_style: ParagraphStyle) -> float:
    paragraph = para(text, paragraph_style)
    _, height = paragraph.wrap(width, 1000 * mm)
    paragraph.drawOn(pdf, x, top_y - height)
    return top_y - height


def draw_label_value(pdf: canvas.Canvas, label: str, value: str, x: float, y: float, label_width: float, value_width: float) -> None:
    pdf.setFont(PDF_FONT, 9)
    pdf.drawString(x, y, label)
    value_x = x + label_width
    pdf.setFont(PDF_BOLD, 9)
    pdf.drawString(value_x, y, value)
    pdf.setLineWidth(0.35)
    pdf.line(value_x, y - 1.2 * mm, value_x + value_width, y - 1.2 * mm)


def draw_cover(pdf: canvas.Canvas) -> None:
    width, height = A4
    logo = Image(str(LOGO), width=24 * mm, height=24 * mm)
    logo.wrapOn(pdf, 24 * mm, 24 * mm)
    logo.drawOn(pdf, width / 2 - 12 * mm, height - 36 * mm)

    pdf.setFont(PDF_BOLD, 13)
    pdf.drawCentredString(width / 2, height - 44 * mm, "โครงการสอน ภาคเรียนที่ 1/2569")
    pdf.setFont(PDF_BOLD, 10.5)
    pdf.drawCentredString(width / 2, height - 51 * mm, f"{COURSE_NAME} ({COURSE_ENGLISH})")
    pdf.setFont(PDF_FONT, 9.5)
    pdf.drawCentredString(width / 2, height - 57 * mm, f"รหัสวิชา {COURSE_CODE}    (ท-ป-น) {CREDITS}")
    pdf.drawCentredString(width / 2, height - 63 * mm, f"เวลาเรียน {WEEKLY_HOURS} ชั่วโมง/สัปดาห์    รวม {TOTAL_HOURS} ชั่วโมง/ภาคเรียน")
    pdf.drawCentredString(width / 2, height - 69 * mm, f"ระดับชั้น {LEVEL}    ครูผู้สอน {TEACHER}")
    pdf.drawCentredString(width / 2, height - 75 * mm, COLLEGE)
    pdf.setLineWidth(0.8)
    pdf.line(28 * mm, height - 81 * mm, width - 20 * mm, height - 81 * mm)

    x = 30 * mm
    usable = width - 50 * mm
    y = height - 91 * mm
    pdf.setFont(PDF_BOLD, 11)
    pdf.drawString(x, y, "จุดประสงค์รายวิชา")
    y -= 6 * mm
    for item in OBJECTIVE_LINES:
        y = draw_paragraph(pdf, item, x + 4 * mm, y, usable - 4 * mm, COVER_ITEM) - 1.2 * mm

    y -= 5 * mm
    pdf.setFont(PDF_BOLD, 11)
    pdf.drawString(x, y, "สมรรถนะรายวิชา")
    y -= 6 * mm
    for item in COMPETENCY_LINES:
        y = draw_paragraph(pdf, item, x + 4 * mm, y, usable - 4 * mm, COVER_ITEM) - 1.2 * mm

    y -= 5 * mm
    pdf.setFont(PDF_BOLD, 11)
    pdf.drawString(x, y, "คำอธิบายรายวิชา")
    y -= 6 * mm
    description = " ".join(DESCRIPTION_LINES)
    draw_paragraph(pdf, description, x + 4 * mm, y, usable - 4 * mm, COVER_DESC)
    pdf.showPage()


def schedule_topic(title: str, line1: str, line2: str) -> Paragraph:
    text = f"<b>{escape(title)}</b><br/>{escape(line1)}<br/>{escape(line2)}"
    return Paragraph(text, SCHEDULE_CELL)


def schedule_table(rows, include_header: bool, include_total: bool) -> Table:
    data = []
    if include_header:
        data.append(
            [
                para("สัปดาห์\nที่", SCHEDULE_HEADER),
                para("หน่วย\nที่", SCHEDULE_HEADER),
                para("ชื่อหน่วย/รายการสอน", SCHEDULE_HEADER),
                para("จำนวน\nชั่วโมง", SCHEDULE_HEADER),
                para("คะแนนเก็บ", SCHEDULE_HEADER),
            ]
        )
    for week, unit, title, line1, line2, hours, score in rows:
        data.append(
            [
                para(week, SCHEDULE_CENTER, True),
                para(unit, SCHEDULE_CENTER),
                schedule_topic(title, line1, line2),
                para(hours, SCHEDULE_CENTER),
                para("" if score is None else score, SCHEDULE_CENTER),
            ]
        )
    if include_total:
        data.append(
            [
                para("รวมจำนวนชั่วโมง/ภาคเรียน", BODY_BOLD),
                "",
                "",
                para(TOTAL_HOURS, BODY_CENTER, True),
                para(COURSEWORK_SCORE, BODY_CENTER, True),
            ]
        )

    widths = [16.92, 14.99, 97.53, 20.0, 26.28]
    heights = []
    if include_header:
        heights.append(13 * mm)
    heights.extend([18 * mm] * len(rows))
    if include_total:
        heights.append(10 * mm)
    table = Table(data, colWidths=[w * mm for w in widths], rowHeights=heights)
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.45, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.3),
        ("TOPPADDING", (0, 0), (-1, -1), 1.7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1.7),
    ]
    if include_total:
        commands.append(("SPAN", (0, -1), (2, -1)))
        commands.append(("ALIGN", (0, -1), (2, -1), "RIGHT"))
    table.setStyle(TableStyle(commands))
    return table


def draw_schedule_header(pdf: canvas.Canvas, continued: bool = False) -> float:
    width, height = A4
    top = height - 20 * mm
    pdf.setFont(PDF_BOLD, 13.5)
    title = "โครงการสอน/แผนการจัดการเรียนรู้ตลอดภาคเรียน/กิจกรรมการเรียนการสอน"
    if continued:
        title += " (ต่อ)"
    pdf.drawCentredString(width / 2, top, title)
    y = top - 11 * mm
    draw_label_value(pdf, "ชื่อวิชา ", COURSE_NAME, 20 * mm, y, 18 * mm, 75 * mm)
    draw_label_value(pdf, "รหัสวิชา ", COURSE_CODE, 120 * mm, y, 20 * mm, 28 * mm)
    draw_label_value(pdf, "(ท-ป-น) ", CREDITS, 172 * mm, y, 18 * mm, 15 * mm)
    y -= 8 * mm
    draw_label_value(pdf, "เวลาเรียน ", f"{WEEKLY_HOURS} ชั่วโมง/สัปดาห์", 44 * mm, y, 20 * mm, 44 * mm)
    draw_label_value(pdf, "รวม ", f"{TOTAL_HOURS} ชั่วโมง/ภาคเรียน", 120 * mm, y, 12 * mm, 52 * mm)
    return y - 10 * mm


def draw_schedule(pdf: canvas.Canvas) -> None:
    width, _ = A4
    first_y = draw_schedule_header(pdf)
    first_table = schedule_table(PROJECT_ROWS[:10], True, False)
    first_height = 13 * mm + 10 * 18 * mm
    first_table.wrapOn(pdf, width - 34 * mm, first_height)
    first_table.drawOn(pdf, 17 * mm, first_y - first_height)
    pdf.showPage()

    second_y = draw_schedule_header(pdf, True)
    second_table = schedule_table(PROJECT_ROWS[10:], True, True)
    second_height = 13 * mm + 5 * 18 * mm + 10 * mm
    second_table.wrapOn(pdf, width - 34 * mm, second_height)
    second_table.drawOn(pdf, 17 * mm, second_y - second_height)
    pdf.setFont(PDF_BOLD, 8.5)
    pdf.drawCentredString(
        width / 2,
        second_y - second_height - 8 * mm,
        "สัดส่วนคะแนน: คะแนนเก็บ/ใบงาน 35 | Project 15 | สอบปฏิบัติ 10 | สอบปลายภาค 20 | จิตพิสัย 20 คะแนน",
    )
    pdf.showPage()


def analysis_table(items) -> Table:
    headers = [
        "หน่วย\nที่",
        "ชื่อหน่วย",
        "สมรรถนะวิชาชีพ",
        "จุดประสงค์รายวิชา",
        "เนื้อหาสาระ (โดยย่อ)",
        "กิจกรรมการเรียนรู้",
        "สื่อ\nการเรียนรู้",
        "วิธีการประเมิน",
        "เวลา\n(ชม.)",
    ]
    data = [[para(text, ANALYSIS_HEADER) for text in headers]]
    for item in items:
        assessment = item["assessment"]
        if item["unit"] == "12":
            assessment = "Project 15 คะแนน; Rubric; Demo; Runbook; การทำงานเป็นทีม"
        values = [
            item["unit"],
            item["name"],
            item["competency"],
            item["objective"],
            item["content"],
            item["activity"],
            item["media"],
            assessment,
            item["hours"],
        ]
        row = []
        for column, value in enumerate(values):
            paragraph_style = ANALYSIS_CENTER if column in (0, 3, 8) else ANALYSIS_CELL
            row.append(para(value, paragraph_style, column in (0, 1)))
        data.append(row)

    widths = [15.40, 37.41, 40.06, 40.06, 42.74, 40.06, 21.36, 29.40, 13.34]
    row_heights = [12 * mm] + [27 * mm] * len(items)
    table = Table(data, colWidths=[w * mm for w in widths], rowHeights=row_heights)
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 1.4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 1.4),
                ("TOPPADDING", (0, 0), (-1, -1), 1.2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.2),
            ]
        )
    )
    return table


def draw_analysis_header(pdf: canvas.Canvas, page_number: int) -> float:
    width, height = landscape(A4)
    if page_number == 1:
        logo = Image(str(LOGO), width=21 * mm, height=21 * mm)
        logo.wrapOn(pdf, 21 * mm, 21 * mm)
        logo.drawOn(pdf, width / 2 - 10.5 * mm, height - 30 * mm)
        pdf.setFont(PDF_BOLD, 14)
        pdf.drawCentredString(width / 2, height - 37 * mm, "ตารางวิเคราะห์การจัดการเรียนรู้")
        pdf.setFont(PDF_FONT, 9)
        pdf.drawCentredString(width / 2, height - 45 * mm, f"วิชา {COURSE_NAME}    รหัสวิชา {COURSE_CODE}    จำนวน (ท-ป-น) {CREDITS}")
        pdf.drawCentredString(width / 2, height - 52 * mm, f"เวลาเรียน {WEEKLY_HOURS} ชั่วโมง : สัปดาห์    รวม {TOTAL_HOURS} ชั่วโมง : ภาคเรียน")
        return height - 58 * mm
    pdf.setFont(PDF_BOLD, 11)
    pdf.drawCentredString(width / 2, height - 12 * mm, f"ตารางวิเคราะห์การจัดการเรียนรู้ (ต่อ {page_number - 1})")
    return height - 18 * mm


def draw_analysis(pdf: canvas.Canvas) -> None:
    page_size = landscape(A4)
    width, _ = page_size
    chunks = [ANALYSIS_ROWS[:5], ANALYSIS_ROWS[5:10], ANALYSIS_ROWS[10:]]
    for page_number, items in enumerate(chunks, start=1):
        top = draw_analysis_header(pdf, page_number)
        table = analysis_table(items)
        table_height = 12 * mm + 27 * mm * len(items)
        table.wrapOn(pdf, width - 16 * mm, table_height)
        table.drawOn(pdf, 8 * mm, top - table_height)
        pdf.showPage()


def draw_signature_pair(pdf: canvas.Canvas, y: float, left_name: str, left_title: str, right_name: str, right_title: str) -> None:
    width, _ = landscape(A4)
    left_center = 78 * mm
    right_center = width - 78 * mm
    for center, name, title in ((left_center, left_name, left_title), (right_center, right_name, right_title)):
        pdf.setFont(PDF_FONT, 10)
        pdf.drawCentredString(center, y, "ลงชื่อ.............................................................")
        pdf.drawCentredString(center, y - 8 * mm, f"({name})")
        pdf.drawCentredString(center, y - 16 * mm, title)
        pdf.drawCentredString(center, y - 24 * mm, "วันที่............../..................../.............................")


def draw_signatures(pdf: canvas.Canvas) -> None:
    width, height = landscape(A4)
    pdf.setFont(PDF_BOLD, 13)
    pdf.drawCentredString(width / 2, height - 20 * mm, "การรับรองและอนุมัติโครงการสอน")

    pdf.setFont(PDF_FONT, 10)
    pdf.drawCentredString(width / 2, height - 37 * mm, "ลงชื่อ.............................................................ครูผู้สอน")
    pdf.drawCentredString(width / 2, height - 45 * mm, f"({TEACHER})")
    pdf.drawCentredString(width / 2, height - 53 * mm, "ครูประจำ/ครูอัตราจ้าง สาขาวิชาเทคโนโลยีสารสนเทศ")

    draw_signature_pair(
        pdf,
        height - 78 * mm,
        ".....................................................",
        "หัวหน้าสาขาวิชาเทคโนโลยีสารสนเทศ",
        "นางสาวพันทิพา พานิชสุโข",
        "หัวหน้างานพัฒนาหลักสูตรการเรียนการสอน",
    )
    draw_signature_pair(
        pdf,
        height - 125 * mm,
        "นางสาวพัชรา เอกสินิทธ์กุล",
        "รองผู้อำนวยการฝ่ายวิชาการ",
        "นายวุฒิชัย รักชาติ",
        "ผู้อำนวยการวิทยาลัยอาชีวศึกษานครปฐม",
    )
    pdf.showPage()


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle(f"เค้าโครงการสอน {COURSE_CODE} {COURSE_NAME}")
    pdf.setAuthor(TEACHER)
    pdf.setSubject("ภาคเรียนที่ 1 ปีการศึกษา 2569")
    draw_cover(pdf)
    draw_schedule(pdf)
    pdf.setPageSize(landscape(A4))
    draw_analysis(pdf)
    draw_signatures(pdf)
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
