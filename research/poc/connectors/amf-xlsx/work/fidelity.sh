#!/bin/bash
# usage: fidelity.sh template.xlsx output.xlsx  -> counts of dropdowns / protection / names preserved
for f in "$1" "$2"; do
  t=$(mktemp -d); unzip -oq "$f" -d "$t"
  echo "== $(basename "$f")"
  echo "  list dropdowns (x14 ext): $(cat $t/xl/worksheets/*.xml | grep -o '<x14:dataValidation ' | wc -l)"
  echo "  classic dataValidation:   $(cat $t/xl/worksheets/*.xml | grep -o '<dataValidation ' | wc -l)"
  echo "  sheetProtection:          $(cat $t/xl/worksheets/*.xml | grep -o '<sheetProtection' | wc -l)"
  echo "  workbookProtection:       $(grep -o '<workbookProtection' $t/xl/workbook.xml | wc -l)"
  echo "  definedNames:             $(grep -o '<definedName ' $t/xl/workbook.xml | wc -l)"
  rm -rf "$t"
done
