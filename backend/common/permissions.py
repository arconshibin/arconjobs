# common/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

def _role(user):
    return getattr(getattr(user, "profile", None), "role", None)

class IsAdminOrStaffOrReadOnly(BasePermission):
    """
    Read: any authenticated user.
    Write: Django superuser/staff OR profile.role in {"admin","staff"}.
    """
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False  # require auth even for reads

        if request.method in SAFE_METHODS:
            return True

        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        return _role(user) in {"admin", "staff"}

    def has_object_permission(self, request, view, obj):
        # same rules at object level
        return self.has_permission(request, view)

class IsSuperuserOrStaff(BasePermission):
    """
    Permission that only allows Django superusers or Django staff users.
    Profile roles are ignored.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and (user.is_superuser or user.is_staff))

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

        
class IsSelfCandidateOrAdminStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        r = _role(request.user)
        if r in {"admin", "staff"}:
            return True
        if request.method not in SAFE_METHODS:
            return False
        cand = getattr(getattr(request.user, "profile", None), "candidate", None)
        # Candidate can read their own Candidate/Application objects
        if hasattr(obj, "profile"):              # Candidate object
            return cand and obj.id == cand.id
        if hasattr(obj, "candidate_id"):         # Application object
            return cand and obj.candidate_id == cand.id
        return False
