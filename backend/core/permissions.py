from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Allows access only to Admin role users (or superusers)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == "ADMIN")
        )


class IsNurse(BasePermission):
    """Allows access only to Nurse role users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == "NURSE")
        )


class IsDoctor(BasePermission):
    """Allows access only to Doctor role users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == "DOCTOR")
        )


class IsNurseOrDoctor(BasePermission):
    """Allows access to either Nurse or Doctor (e.g. shared read-only lookups)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role in ("NURSE", "DOCTOR"))
        )


class IsAdminOrReadOnlyForStaff(BasePermission):
    """
    Admins get full CRUD. Nurses/Doctors get read-only access.
    Useful for shared lookup data like Medicines, ICD10Codes, ConsultationTypes.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_superuser or user.role == "ADMIN":
            return True
        return request.method in SAFE_METHODS