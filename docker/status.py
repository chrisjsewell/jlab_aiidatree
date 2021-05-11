def verdi_status(with_rmq=False, with_daemon=False):
    """Print status of AiiDA services."""
    # pylint: disable=broad-except,too-many-statements
    from aiida.common.log import override_log_level
    from aiida.cmdline.utils.daemon import get_daemon_status, delete_stale_pid_file
    from aiida.common.utils import Capturing
    from aiida.manage.external.rmq import get_rmq_url
    from aiida.manage.manager import get_manager
    from aiida.manage.configuration.settings import AIIDA_CONFIG_FOLDER

    class ExitCode:
        SUCCESS = 0
        CRITICAL = 1

    exit_code = ExitCode.SUCCESS

    manager = get_manager()
    profile = manager.get_profile()

    try:
        profile = manager.get_profile()
        print_status(ServiceStatus.UP, 'profile', 'On profile {}'.format(profile.name))

    except Exception as exc:
        print_status(ServiceStatus.ERROR, 'profile', 'Unable to read AiiDA profile')
        sys.exit(ExitCode.CRITICAL)  # stop here - without a profile we cannot access anything


        print_status(ServiceStatus.ERROR, 'profile', 'Unable to read AiiDA profile')
        sys.exit(ExitCode.CRITICAL)  # stop here - without a profile we cannot access anything

    # getting the repository
    repo_folder = 'undefined'
    try:
        repo_folder = profile.repository_path
    except Exception as exc:
        print_status(ServiceStatus.ERROR, 'repository', 'Error with repo folder', exception=exc)
        exit_code = ExitCode.CRITICAL
    else:
        print_status(ServiceStatus.UP, 'repository', repo_folder)

    # Getting the postgres status by trying to get a database cursor
    database_data = [profile.database_username, profile.database_hostname, profile.database_port]
    try:
        with override_log_level():  # temporarily suppress noisy logging
            backend = manager.get_backend()
            backend.cursor()
    except Exception:
        print_status(ServiceStatus.DOWN, 'postgres', 'Unable to connect as {}@{}:{}'.format(*database_data))
        exit_code = ExitCode.CRITICAL
    else:
        print_status(ServiceStatus.UP, 'postgres', 'Connected as {}@{}:{}'.format(*database_data))

    if not with_rmq:
        sys.exit(exit_code)

    # getting the rmq status
    try:
        with Capturing(capture_stderr=True):
            with override_log_level():  # temporarily suppress noisy logging
                comm = manager.create_communicator(with_orm=False)
                comm.stop()
    except Exception as exc:
        print_status(ServiceStatus.ERROR, 'rabbitmq', 'Unable to connect to rabbitmq', exception=exc)
        exit_code = ExitCode.CRITICAL
    else:
        print_status(ServiceStatus.UP, 'rabbitmq', 'Connected to {}'.format(get_rmq_url()))

    if not with_daemon:
        sys.exit(exit_code)

    # getting the daemon status
    try:
        client = manager.get_daemon_client()
        delete_stale_pid_file(client)
        daemon_status = get_daemon_status(client)

        daemon_status = daemon_status.split('\n')[0]  # take only the first line
        if client.is_daemon_running:
            print_status(ServiceStatus.UP, 'daemon', daemon_status)
        else:
            print_status(ServiceStatus.DOWN, 'daemon', daemon_status)
            exit_code = ExitCode.CRITICAL

    except Exception as exc:
        print_status(ServiceStatus.ERROR, 'daemon', 'Error getting daemon status', exception=exc)
        exit_code = ExitCode.CRITICAL

    # Note: click does not forward return values to the exit code, see https://github.com/pallets/click/issues/747
    sys.exit(exit_code)


if __name__ == "__main__":
    import sys
    _with_rmq = _with_daemon = False
    if len(sys.argv) > 1:
        _with_rmq = True
    if len(sys.argv) > 2:
        _with_daemon = True
    verdi_status(_with_rmq, _with_daemon)
