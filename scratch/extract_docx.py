import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        paragraphs = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    path = '/Users/surachartlimrattanaphun/Desktop/NOS/NOS/documents/แผนการสอน_31901-2002_ฉบับสมบูรณ์_v2 (1).docx'
    text = get_docx_text(path)
    with open('/Users/surachartlimrattanaphun/Desktop/NOS/NOS/scratch/extracted_syllabus.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Successfully extracted docx text to scratch/extracted_syllabus.txt")
