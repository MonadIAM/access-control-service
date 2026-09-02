#!/usr/bin/env bash

source "$(dirname -- "${BASH_SOURCE[0]}")/logger.sh"

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DTO_FILE="$ROOT_DIR/src/common/dto/env.dto.ts"
TEMPLATE_GLOB="$ROOT_DIR/.env.*.example"
ENTRYPOINTS=("$ROOT_DIR/docker/app/entrypoint.sh" "$ROOT_DIR/docker/app/with-vault-secrets.sh")
SECRET_DIR="/vault/secrets"

WORK_DIR=""
TEMPLATES=()
LABELS=()

abort() {
    log_verdict "failed" "ENV CHECK FAILED:" "$1"
    exit 1
}

remove_work_dir() {
    if [ -n "$WORK_DIR" ] && [ -d "$WORK_DIR" ]; then
        rm -rf "$WORK_DIR"
    fi
}

require_dependencies() {
    local entrypoint

    if [ ! -f "$DTO_FILE" ]; then
        abort "environment DTO not found: ${DTO_FILE#"$ROOT_DIR/"}"
    fi

    for entrypoint in "${ENTRYPOINTS[@]}"; do
        if [ ! -f "$entrypoint" ]; then
            abort "entrypoint not found: ${entrypoint#"$ROOT_DIR/"}"
        fi
    done
}

read_templates() {
    local file

    for file in $TEMPLATE_GLOB; do
        if [ -f "$file" ]; then
            TEMPLATES+=("$file")
            LABELS+=("$(basename -- "$file" | sed -E 's/^\.env\.(.*)\.example$/\1/')")
        fi
    done

    if [ "${#TEMPLATES[@]}" -eq 0 ]; then
        abort "no templates matching ${TEMPLATE_GLOB#"$ROOT_DIR/"}"
    fi
}

dump_dto_fields() {
    grep -oE 'declare public [A-Z0-9_]+\??' "$DTO_FILE" \
        | sed -E 's/^declare public ([A-Z0-9_]+)(\?)?$/\1\t\2/' \
        | sort >"$WORK_DIR/dto.fields" || true

    if [ ! -s "$WORK_DIR/dto.fields" ]; then
        abort "no fields parsed from ${DTO_FILE#"$ROOT_DIR/"}"
    fi

    cut -f1 "$WORK_DIR/dto.fields" >"$WORK_DIR/dto.keys"
}

dump_injected_keys() {
    grep -hoE '^export [A-Z0-9_]+="\$\(cat '"$SECRET_DIR"'/' "${ENTRYPOINTS[@]}" \
        | sed -E 's/^export ([A-Z0-9_]+)=.*$/\1/' \
        | sort -u >"$WORK_DIR/injected.keys" || true

    comm -12 "$WORK_DIR/injected.keys" "$WORK_DIR/dto.keys" >"$WORK_DIR/injected.validated"
    comm -23 "$WORK_DIR/dto.keys" "$WORK_DIR/injected.validated" >"$WORK_DIR/expected.keys"

    awk -F'\t' '$2 == "" { print $1 }' "$WORK_DIR/dto.fields" \
        | comm -12 "$WORK_DIR/expected.keys" - >"$WORK_DIR/required.keys"
}

dump_template_keys() {
    local index label

    : >"$WORK_DIR/union.keys"

    for index in "${!TEMPLATES[@]}"; do
        label="${LABELS[$index]}"

        grep -oE '^[A-Z0-9_]+[[:space:]]*=' "${TEMPLATES[$index]}" \
            | sed -E 's/[[:space:]]*=$//' >"$WORK_DIR/$label.raw" || true

        sort "$WORK_DIR/$label.raw" | uniq -d >"$WORK_DIR/$label.duplicates"
        sort -u "$WORK_DIR/$label.raw" >"$WORK_DIR/$label.keys"

        cat "$WORK_DIR/$label.keys" >>"$WORK_DIR/union.keys"
    done

    sort -u -o "$WORK_DIR/union.keys" "$WORK_DIR/union.keys"
}

owners_of() {
    local key="$1" index label owners=""

    for index in "${!LABELS[@]}"; do
        label="${LABELS[$index]}"

        if grep -qxF "$key" "$WORK_DIR/$label.keys"; then
            owners="${owners:+$owners, }$label"
        fi
    done

    printf "%s" "$owners"
}

prepare() {
    require_dependencies
    read_templates

    WORK_DIR="$(mktemp -d)"
    trap remove_work_dir EXIT

    dump_dto_fields
    dump_injected_keys
    dump_template_keys
}
