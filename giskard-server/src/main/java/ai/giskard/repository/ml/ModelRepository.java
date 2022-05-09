package ai.giskard.repository.ml;

import ai.giskard.domain.ml.ProjectModel;
import ai.giskard.repository.MappableJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModelRepository extends MappableJpaRepository<ProjectModel, Long> {
    List<ProjectModel> findAllByProjectId(long projectId);
}
