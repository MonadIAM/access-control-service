#!/usr/bin/env bash
set -euo pipefail

source "$(dirname -- "${BASH_SOURCE[0]}")/env.utils.sh"
source "$(dirname -- "${BASH_SOURCE[0]}")/logger.sh"

CHECK_FUNCTIONS=(check_validated_keys check_declared_fields check_template_coverage check_injected_keys check_duplicate_keys)
CHECK_TITLES=("Validated keys" "Declared fields" "Template coverage" "Injected keys" "Duplicate keys")

check_validated_keys() {
    local key owners status=0

    while IFS= read -r key; do
        owners="$(owners_of "$key")"

        log_finding "$key: declared in [$owners] but absent from EnvironmentVariablesDTO"
        status=1
    done < <(comm -23 "$WORK_DIR/union.keys" "$WORK_DIR/dto.keys")

    return $status
}

check_declared_fields() {
    local field status=0

    while IFS= read -r field; do
        log_finding "$field: validated but declared in no template"
        status=1
    done < <(comm -13 "$WORK_DIR/union.keys" "$WORK_DIR/expected.keys")

    return $status
}

check_template_coverage() {
    local index label field status=0

    for index in "${!LABELS[@]}"; do
        label="${LABELS[$index]}"

        comm -23 "$WORK_DIR/required.keys" "$WORK_DIR/$label.keys" >"$WORK_DIR/$label.missing"

        while IFS= read -r field; do
            log_finding "$label: missing required key: $field"
            status=1
        done <"$WORK_DIR/$label.missing"
    done

    return $status
}

check_injected_keys() {
    local key owners status=0

    while IFS= read -r key; do
        log_finding "$key: exported by the entrypoint but absent from EnvironmentVariablesDTO"
        status=1
    done < <(comm -23 "$WORK_DIR/injected.keys" "$WORK_DIR/dto.keys")

    while IFS= read -r key; do
        owners="$(owners_of "$key")"

        if [ -n "$owners" ]; then
            log_finding "$key: declared in [$owners] but overridden by the entrypoint at runtime"
            status=1
        fi
    done <"$WORK_DIR/injected.validated"

    return $status
}

check_duplicate_keys() {
    local index label key status=0

    for index in "${!LABELS[@]}"; do
        label="${LABELS[$index]}"

        while IFS= read -r key; do
            log_finding "$label: duplicate key: $key"
            status=1
        done <"$WORK_DIR/$label.duplicates"
    done

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
        log_context "Templates: ${LABELS[*]}" \
            "Fields: $(wc -l <"$WORK_DIR/dto.keys" | tr -d ' ')" \
            "Injected: $(wc -l <"$WORK_DIR/injected.validated" | tr -d ' ')"
    fi

    for index in "${!CHECK_TITLES[@]}"; do
        number=$((index + 1))

        if ! run_check "$number" "${CHECK_TITLES[$index]}" "${CHECK_FUNCTIONS[$index]}"; then
            failed=$((failed + 1))
        fi
    done

    if [ "$failed" -gt 0 ]; then
        log_verdict "failed" "ENV CHECK FAILED:" "$failed of ${#CHECK_TITLES[@]} checks did not pass"
        exit 1
    fi

    log_verdict "passed" "ENV CHECK PASSED:" "${#CHECK_TITLES[@]} of ${#CHECK_TITLES[@]} checks passed"
}

main
