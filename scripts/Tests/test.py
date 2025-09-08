# Tests/test.py
import os
import re

# 현재 test.py 파일의 상위 디렉토리 경로 구하기
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# main.js 경로 지정
main_js_path = os.path.join(parent_dir, "main.js")

# main.js 내용 읽기
with open(main_js_path, "r", encoding="utf-8") as f:
    js_code = f.read()

# 함수 이름 정규식으로 추출 (function foo() { ... } 또는 const foo = () => { ... } 등)
pattern = r"(?:function\s+([a-zA-Z_]\w*)|const\s+([a-zA-Z_]\w*)\s*=\s*\()"
matches = re.findall(pattern, js_code)

# 결과 정리
functions = [name for tup in matches for name in tup if name]

print("찾은 함수들:")
for func in functions:
    print("-", func)
