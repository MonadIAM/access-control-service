#!/usr/bin/env bash
set -euo pipefail

source "$(dirname -- "${BASH_SOURCE[0]}")/intl.utils.sh"
source "$(dirname -- "${BASH_SOURCE[0]}")/logger.sh"

CHECK_FUNCTIONS=(check_language_symmetry check_generated_types check_placeholder_symmetry check_values check_unused_keys check_missing_keys)
CHECK_TITLES=("Language symmetry" "Generated types" "Placeholder symmetry" "Translation values" "Unused keys" "Missing keys")

check_language_symmetry() {
    local language key status=0

    for language in "${LANGUAGES[@]}"; do
        if [ "$language" = "$REFERENCE_LANGUAGE" ]; then
            continue
        fi

        comm -23 "$WORK_DIR/$REFERENCE_LANGUAGE.keys" "$WORK_DIR/$language.keys" >"$WORK_DIR/$language.missing"
        comm -13 "$WORK_DIR/$REFERENCE_LANGUAGE.keys" "$WORK_DIR/$language.keys" >"$WORK_DIR/$language.unknown"

        while IFS= read -r key; do
            log_finding "$language: missing key: $key"
            status=1
        done <"$WORK_DIR/$language.missing"

        while IFS= read -r key; do
            log_finding "$language: key is absent in $REFERENCE_LANGUAGE: $key"
            status=1
        done <"$WORK_DIR/$language.unknown"
    done

    return $status
}

check_generated_types() {
    if [ ! -f "$GENERATED_FILE" ]; then
        log_finding "generated file is missing: ${GENERATED_FILE#"$ROOT_DIR/"}"
        return 1
    fi

    if ! "$CLI" -p "$DICTIONARY_DIR" -o "$WORK_DIR/expected.generated.ts" >/dev/null 2>&1; then
        log_finding "type generation failed"
        return 1
    fi

    if diff -u --label "committed" --label "expected" \
        "$GENERATED_FILE" "$WORK_DIR/expected.generated.ts" >"$WORK_DIR/generated.diff"; then
        return 0
    fi

    log_finding "generated types are stale, run: pnpm run intl:types"
    log_output "$WORK_DIR/generated.diff"

    return 1
}

check_placeholder_symmetry() {
    local language line status=0

    for language in "${LANGUAGES[@]}"; do
        if [ "$language" = "$REFERENCE_LANGUAGE" ]; then
            continue
        fi

        join -t $'\t' "$WORK_DIR/$REFERENCE_LANGUAGE.placeholders" "$WORK_DIR/$language.placeholders" \
            | awk -F'\t' '$2 != $3 { printf "%s: expected [%s], found [%s]\n", $1, $2, $3 }' \
                >"$WORK_DIR/$language.placeholder-diff"

        while IFS= read -r line; do
            log_finding "$language: $line"
            status=1
        done <"$WORK_DIR/$language.placeholder-diff"
    done

    return $status
}

check_values() {
    local language key value status=0

    for language in "${LANGUAGES[@]}"; do
        while IFS=$'\t' read -r key value; do
            if [ -z "${value//[[:space:]]/}" ]; then
                log_finding "$language: empty value: $key"
                status=1
            fi
        done <"$WORK_DIR/$language.values"

        while IFS= read -r key; do
            log_finding "$language: value is not a string: $key"
            status=1
        done <"$WORK_DIR/$language.non-strings"
    done

    return $status
}

check_unused_keys() {
    local key value base dynamic status=0

    while IFS=$'\t' read -r key value; do
        if grep -qxF "$key" "$WORK_DIR/used.keys"; then
            continue
        fi

        dynamic=0
        base="$key"

        while [ "$base" != "${base%.*}" ]; do
            base="${base%.*}"

            if grep -qxF "$base" "$WORK_DIR/dynamic.bases"; then
                dynamic=1
                break
            fi
        done

        if [ "$dynamic" -eq 1 ]; then
            continue
        fi

        log_finding "unused key: $key"
        status=1
    done <"$WORK_DIR/$REFERENCE_LANGUAGE.values"

    return $status
}

check_missing_keys() {
    local key namespace status=0

    while IFS= read -r key; do
        if grep -qxF "$key" "$WORK_DIR/$REFERENCE_LANGUAGE.keys"; then
            continue
        fi

        log_finding "missing key: $key"
        status=1
    done <"$WORK_DIR/composed.keys"

    while IFS= read -r key; do
        namespace="${key%%.*}"

        if ! grep -qxF "$namespace" "$WORK_DIR/namespaces"; then
            continue
        fi

        if grep -qxF "$key" "$WORK_DIR/$REFERENCE_LANGUAGE.keys"; then
            continue
        fi

        if grep -qxF "$key" "$WORK_DIR/composed.keys"; then
            continue
        fi

        log_finding "missing key: $key"
        status=1
    done <"$WORK_DIR/explicit.keys"

    return $status
}

run_check() {
    local number="$1" title="$2" check="$3" findings started status

    findings="$WORK_DIR/check-$number.log"
    started="$(now_ms)"

    if "$check" >"$findings" 2>&1; then
        status="passed"
    else
        status="failed"
    fi

    if [ "$LOG_NESTED" -gt 0 ]; then
        if [ "$status" = "passed" ]; then
            return 0
        fi

        log_step "$title"
        log_raw "$findings"

        return 1
    fi

    log_step "$number. $title"
    log_raw "$findings"
    log_result "$status" "$(($(now_ms) - started))"

    [ "$status" = "passed" ]
}

main() {
    local index number failed=0

    prepare

    if [ "$LOG_NESTED" -eq 0 ]; then
        log_context "Languages: ${LANGUAGES[*]}"
    fi

    for index in "${!CHECK_TITLES[@]}"; do
        number=$((index + 1))

        if ! run_check "$number" "${CHECK_TITLES[$index]}" "${CHECK_FUNCTIONS[$index]}"; then
            failed=$((failed + 1))
        fi
    done

    if [ "$failed" -gt 0 ]; then
        log_verdict "failed" "INTL CHECK FAILED:" "$failed of ${#CHECK_TITLES[@]} checks did not pass"
        exit 1
    fi

    log_verdict "passed" "INTL CHECK PASSED:" "${#CHECK_TITLES[@]} of ${#CHECK_TITLES[@]} checks passed"
}

main
