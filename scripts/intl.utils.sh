#!/usr/bin/env bash

source "$(dirname -- "${BASH_SOURCE[0]}")/logger.sh"

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DICTIONARY_DIR="$ROOT_DIR/src/common/dictionaries"
GENERATED_FILE="$DICTIONARY_DIR/intl.generated.ts"
CLI="$ROOT_DIR/node_modules/.bin/nestjs-i18n"
SOURCE_DIR="$ROOT_DIR/src"
REFERENCE_LANGUAGE="en"

WORK_DIR=""
LANGUAGES=()

abort() {
    log_verdict "failed" "INTL CHECK FAILED:" "$1"
    exit 1
}

remove_work_dir() {
    if [ -n "$WORK_DIR" ] && [ -d "$WORK_DIR" ]; then
        rm -rf "$WORK_DIR"
    fi
}

require_dependencies() {
    if ! command -v jq >/dev/null 2>&1; then
        abort "jq is required"
    fi

    if [ ! -x "$CLI" ]; then
        abort "nestjs-i18n CLI not found: $CLI"
    fi

    if [ ! -d "$DICTIONARY_DIR" ]; then
        abort "dictionary directory not found: $DICTIONARY_DIR"
    fi
}

read_languages() {
    local directory

    for directory in "$DICTIONARY_DIR"/*/; do
        if [ -d "$directory" ]; then
            LANGUAGES+=("$(basename "$directory")")
        fi
    done

    if [ "${#LANGUAGES[@]}" -eq 0 ]; then
        abort "no language directories in $DICTIONARY_DIR"
    fi
}

dump_values() {
    local language="$1" file namespace

    for file in "$DICTIONARY_DIR/$language"/*.json; do
        namespace="$(basename "$file" .json)"

        jq -r --arg namespace "$namespace" '
            paths(scalars) as $path
            | [ ([$namespace] + $path | join(".")), (getpath($path) | tostring) ]
            | @tsv
        ' "$file"
    done | sort >"$WORK_DIR/$language.values"
}

dump_non_strings() {
    local language="$1" file namespace

    for file in "$DICTIONARY_DIR/$language"/*.json; do
        namespace="$(basename "$file" .json)"

        jq -r --arg namespace "$namespace" '
            paths(scalars) as $path
            | select((getpath($path) | type) != "string")
            | ([$namespace] + $path | join("."))
        ' "$file"
    done | sort >"$WORK_DIR/$language.non-strings"
}

dump_placeholders() {
    local language="$1" key value placeholders

    while IFS=$'\t' read -r key value; do
        placeholders="$(printf "%s" "$value" | grep -oE '\{[A-Za-z0-9_]+\}' | sort -u | tr "\n" " " || true)"
        printf "%s\t%s\n" "$key" "$placeholders"
    done <"$WORK_DIR/$language.values" >"$WORK_DIR/$language.placeholders"
}

read_dictionary_path() {
    sed -nE 's/.*dictionaryPath[^=]*= "([^"]+)".*/\1/p' "$1" | head -n1
}

dump_used_keys() {
    local file base

    grep -rhoE '"[a-z][a-zA-Z0-9-]*(\.[A-Za-z0-9_-]+)+"' --include='*.ts' "$SOURCE_DIR" \
        | tr -d '"' | sort -u >"$WORK_DIR/literal.keys" || true

    : >"$WORK_DIR/composed.keys"

    while IFS= read -r file; do
        base="$(read_dictionary_path "$file")"

        grep -oE '\$\{[A-Za-z0-9_.]*dictionaryPath\}\.[A-Za-z0-9_]+`' "$file" \
            | sed -E "s/.*\}\./$base./; s/\`$//" >>"$WORK_DIR/composed.keys" || true
    done <"$WORK_DIR/dictionary-path.files"

    sort -u -o "$WORK_DIR/composed.keys" "$WORK_DIR/composed.keys"
    sort -u "$WORK_DIR/literal.keys" "$WORK_DIR/composed.keys" >"$WORK_DIR/used.keys"
}

dump_explicit_keys() {
    {
        grep -rhoE '[a-zA-Z]*[mM]essage[A-Za-z]*: *"[a-z][a-zA-Z0-9-]*(\.[A-Za-z0-9_-]+)+"' --include='*.ts' "$SOURCE_DIR" || true
        grep -rhoE 'translate\( *"[a-z][a-zA-Z0-9-]*(\.[A-Za-z0-9_-]+)+"' --include='*.ts' "$SOURCE_DIR" || true
    } | grep -oE '"[^"]+"' | tr -d '"' | sort -u >"$WORK_DIR/explicit.keys" || true
}

dump_namespaces() {
    local file

    for file in "$DICTIONARY_DIR/$REFERENCE_LANGUAGE"/*.json; do
        basename "$file" .json
    done | sort >"$WORK_DIR/namespaces"
}

dump_dynamic_bases() {
    local file

    : >"$WORK_DIR/dynamic.bases"

    while IFS= read -r file; do
        if grep -qE '\$\{[A-Za-z0-9_.]*dictionaryPath\}\.[A-Za-z0-9_]*\$\{' "$file"; then
            read_dictionary_path "$file" >>"$WORK_DIR/dynamic.bases"
        fi
    done <"$WORK_DIR/dictionary-path.files"

    grep -rhoE '`[a-z][a-zA-Z0-9-]*(\.[A-Za-z0-9_-]+)*\.\$\{' --include='*.ts' "$SOURCE_DIR" \
        | sed -E 's/^`//; s/\.\$\{$//' >>"$WORK_DIR/dynamic.bases" || true
}

prepare() {
    local language

    require_dependencies
    read_languages

    WORK_DIR="$(mktemp -d)"
    trap remove_work_dir EXIT

    for language in "${LANGUAGES[@]}"; do
        dump_values "$language"
        dump_non_strings "$language"
        dump_placeholders "$language"
        cut -f1 "$WORK_DIR/$language.values" >"$WORK_DIR/$language.keys"
    done

    grep -rlE 'dictionaryPath[^=]*= "' --include='*.ts' "$SOURCE_DIR" | sort >"$WORK_DIR/dictionary-path.files" || true

    dump_namespaces
    dump_used_keys
    dump_explicit_keys
    dump_dynamic_bases
}
